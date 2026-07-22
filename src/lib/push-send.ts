// Envio de Web Push (Node) — helper partilhado por campanhas (admin) e
// notificações por-evento (ex.: resposta a uma reserva). NÃO é "use server":
// é um módulo de servidor importado por server actions.
import webpush from "web-push";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:reddunesolutions@gmail.com";

let configured = false;

/** Garante que o web-push tem as chaves VAPID. Devolve false se faltar a privada. */
export function vapidReady(): boolean {
  if (!VAPID_PRIVATE_KEY) return false;
  if (!configured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configured = true;
  }
  return true;
}

export type PushSub = { endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url?: string };

// Allowlist de hosts dos serviços de push conhecidos. Entradas com "." inicial
// são sufixos de domínio; sem "." são hosts exactos.
const PUSH_HOST_ALLOWLIST = [
  ".googleapis.com", // FCM (fcm.googleapis.com)
  ".push.services.mozilla.com", // Mozilla autopush
  ".notify.windows.com", // WNS
  "web.push.apple.com", // Apple (host exacto)
  ".push.apple.com", // Apple (regional)
];

/** true se `host` for um IP literal privado/loopback/link-local ou 'localhost'. */
function isPrivateOrLocalHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "ip6-localhost") return true;
  // IPv6 literal (pode vir entre parênteses rectos).
  const v6 = h.replace(/^\[|\]$/g, "");
  if (v6 === "::1") return true; // loopback
  if (/^f[cd][0-9a-f]{2}:/.test(v6)) return true; // fc00::/7 (ULA)
  if (/^fe[89ab][0-9a-f]:/.test(v6)) return true; // fe80::/10 (link-local)
  // IPv4 literal.
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  }
  return false;
}

/**
 * Guard anti-SSRF para endpoints de Web Push. A subscrição vem do cliente e o
 * servidor faz POST ao endpoint (web-push), por isso só aceitamos https para
 * hosts dos serviços de push conhecidos e recusamos IPs literais privados.
 */
export function isAllowedPushEndpoint(url: string): boolean {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false; // endpoints de push são sempre https
    host = u.hostname.toLowerCase();
  } catch {
    return false; // URL inválido
  }
  if (!host || isPrivateOrLocalHost(host)) return false;
  return PUSH_HOST_ALLOWLIST.some((s) => (s.startsWith(".") ? host.endsWith(s) : host === s));
}

/** Envia para um conjunto de subscrições. Devolve nº enviados + endpoints expirados. */
export async function sendToSubs(
  subs: PushSub[],
  payload: PushPayload,
): Promise<{ enviados: number; stale: string[] }> {
  const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url || "/app" });
  let enviados = 0;
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      // Defensivo: nunca fazer POST a um endpoint fora da allowlist (SSRF), mesmo
      // que uma subscrição antiga/adulterada tenha escapado à validação de entrada.
      if (!isAllowedPushEndpoint(s.endpoint)) return;
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
        enviados++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) stale.push(s.endpoint);
      }
    }),
  );
  return { enviados, stale };
}

/**
 * Push para um utilizador específico (todos os dispositivos dele).
 * Lê as subscrições via RPC `push_subs_do_user` (SECURITY DEFINER, staff/admin),
 * para que o staff também consiga notificar sem service-role. Silencioso se não
 * houver chave VAPID ou subscrições — a notificação in-app (trigger) é o fallback.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!vapidReady()) return;
  const supabase = await createClient();
  const { data } = await supabase.rpc("push_subs_do_user", { p_user: userId });
  const subs = (data ?? []) as PushSub[];
  if (!subs.length) return;
  const { stale } = await sendToSubs(subs, payload);
  if (stale.length) {
    // Higiene: subscrições mortas saem da BD. Service client porque o chamador
    // (staff) não tem grant de DELETE nas subscrições de terceiros — e não deve ter.
    await createServiceClient().from("push_subscriptions").delete().in("endpoint", stale);
  }
}

/**
 * Push para toda a equipa (staff + admin) — ex.: cliente criou uma reserva.
 * Usa o service client porque aqui o chamador é um CLIENTE, e a RLS (bem)
 * não deixa a sessão dele ler subscrições de terceiros. Só corre no servidor.
 */
export async function sendPushToStaff(payload: PushPayload): Promise<void> {
  if (!vapidReady()) return;
  const svc = createServiceClient();
  const { data } = await svc
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, profiles!inner(role)")
    .in("profiles.role", ["staff", "admin"]);
  const subs = (data ?? []) as unknown as PushSub[];
  if (!subs.length) return;
  const { stale } = await sendToSubs(subs, payload);
  if (stale.length) {
    await svc.from("push_subscriptions").delete().in("endpoint", stale);
  }
}
