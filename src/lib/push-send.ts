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
  await sendToSubs(subs, payload);
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
