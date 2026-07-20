"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { vapidReady, sendToSubs, type PushSub } from "@/lib/push-send";
import { sendClienteEmail } from "@/lib/email-send";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

/** Cliente guarda a subscription do seu dispositivo (upsert robusto via RPC). */
export async function savePushSubscription(sub: z.input<typeof subSchema>): Promise<{ ok?: boolean; error?: string }> {
  const parsed = subSchema.safeParse(sub);
  if (!parsed.success) return { error: "Subscrição inválida." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Volta a entrar." };
  // RPC SECURITY DEFINER (delete-by-endpoint + insert) — evita o buraco de RLS
  // no UPDATE que fazia o upsert falhar na re-subscrição do mesmo dispositivo.
  const { error } = await supabase.rpc("guardar_push_sub", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.keys.p256dh,
    p_auth: parsed.data.keys.auth,
  });
  if (error) {
    console.error("[push] guardar_push_sub:", error);
    return { error: "Não foi possível ativar. Tenta novamente." };
  }
  return { ok: true };
}

/** Push de boas-vindas ao próprio utilizador, ao ativar — mostra logo o que é. */
export async function pushBoasVindas(lang?: string): Promise<void> {
  if (!vapidReady()) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: rows } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);
  const subs: PushSub[] = (rows ?? []).map((s) => ({ endpoint: s.endpoint as string, p256dh: s.p256dh as string, auth: s.auth as string }));
  if (!subs.length) return;
  const en = lang === "en";
  const { stale } = await sendToSubs(subs, {
    title: en ? "Notifications on ✓" : "Notificações ativadas ✓",
    body: en ? "You'll now get the café's news and offers right here." : "A partir de agora recebes aqui as novidades e ofertas do café.",
    url: "/app",
  });
  if (stale.length) await supabase.from("push_subscriptions").delete().in("endpoint", stale);
}

/** Cliente remove a subscription do dispositivo. */
export async function removePushSubscription(endpoint: string): Promise<{ ok?: boolean }> {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: true };
}

const campSchema = z.object({
  titulo: z.string().trim().min(2).max(80),
  corpo: z.string().trim().min(2).max(300),
  segmento: z.string().trim().max(40).optional().or(z.literal("")),
  url: z.string().trim().max(300).optional().or(z.literal("")),
});

/** Admin envia uma campanha, opcionalmente só a um segmento (food_pref).
 *  Coerência (auditoria 2026-07-20): a campanha fica SEMPRE na app (in-app,
 *  fan-out via RPC) + push aos dispositivos subscritos DE CLIENTES + email aos
 *  clientes com emails ativos. Antes só existia em push e a equipa também recebia. */
export async function enviarCampanha(
  input: z.input<typeof campSchema>,
): Promise<{ enviados?: number; alvo?: number; inapp?: number; emails?: number; error?: string }> {
  await assertAdmin();
  const parsed = campSchema.safeParse(input);
  if (!parsed.success) return { error: "Preenche o título e a mensagem." };

  const { titulo, corpo, segmento, url } = parsed.data;
  const supabase = await createClient();

  // 1) Leituras que podem falhar vêm PRIMEIRO — a partir do fan-out in-app não
  //    há mais returns de erro, senão um retry do admin duplicava a campanha.
  let q = supabase.from("push_subscriptions").select("endpoint, p256dh, auth, profiles!inner(food_pref, role)").eq("profiles.role", "customer");
  if (segmento) q = q.eq("profiles.food_pref", segmento);
  const { data: rows, error } = await q;
  if (error) return { error: "Não foi possível ler os subscritores." };
  const subs: PushSub[] = (rows ?? []).map((s) => ({
    endpoint: s.endpoint as string,
    p256dh: s.p256dh as string,
    auth: s.auth as string,
  }));

  // 2) In-app para todos os clientes do alvo (fica na app mesmo sem push/email).
  const { data: inappData, error: inappErr } = await supabase.rpc("admin_campanha_inapp", {
    p_titulo: titulo,
    p_corpo: corpo,
    p_segmento: segmento || "",
  });
  if (inappErr) return { error: "Não foi possível criar as notificações na app." };
  const inapp = (inappData as number | null) ?? 0;

  // 3) Push — só dispositivos de CLIENTES (a equipa não recebe marketing).
  //    Sem VAPID o push é saltado, mas in-app e email seguem na mesma.
  let enviados = 0;
  if (subs.length && vapidReady()) {
    const r = await sendToSubs(subs, { title: titulo, body: corpo, url });
    enviados = r.enviados;
    if (r.stale.length) await supabase.from("push_subscriptions").delete().in("endpoint", r.stale);
  }

  // 4) Email — clientes do alvo com email_notifs ativo (BCC, best-effort).
  let emails = 0;
  const { data: emailRows } = await supabase.rpc("admin_emails_notif", { p_segmento: segmento || "" });
  const dests = ((emailRows ?? []) as { email: string }[]).map((e) => e.email);
  if (dests.length) {
    try {
      // Só conta se saiu mesmo (false = SMTP não configurado).
      if (await sendClienteEmail(dests, { assunto: titulo, titulo, corpo, ctaUrl: "https://www.osamigosdobairro.pt/app" })) {
        emails = dests.length;
      }
    } catch (e) {
      console.error("[campanha] email falhou:", e);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("push_campaigns").insert({
    titulo, corpo, segmento: segmento || null, url: url || null, enviados, created_by: user?.id ?? null,
  });

  return { enviados, alvo: subs.length, inapp, emails };
}

// Rate-limit leve do welcome email (por instância): evita usar o SMTP do café
// como spam ligando/desligando o toggle em loop. Persistência não justifica tabela.
const welcomeSentAt = new Map<string, number>();

/** Cliente liga/desliga os emails do café (por conta). Welcome email ao ligar. */
export async function setEmailNotifs(on: boolean): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Volta a entrar." };
  // `select` devolve as linhas alteradas: com o filtro neq, 0 linhas = já estava
  // neste valor → não repete o welcome (toggle obsoleto/duplo clique = no-op).
  const { data: changed, error } = await supabase
    .from("profiles")
    .update({ email_notifs: on })
    .eq("id", user.id)
    .neq("email_notifs", on)
    .select("id");
  if (error) return { error: "Não foi possível guardar. Tenta novamente." };
  const mudou = (changed ?? []).length > 0;
  const last = welcomeSentAt.get(user.id) ?? 0;
  if (on && mudou && user.email && Date.now() - last > 10 * 60_000) {
    // Confirmação imediata, como o push de boas-vindas — best-effort.
    try {
      await sendClienteEmail(user.email, {
        assunto: "Emails ativados ✓ · Os Amigos do Bairro",
        titulo: "Emails ativados ✓",
        corpo: "A partir de agora recebes por email as tuas reservas, ofertas e novidades do café.",
        ctaUrl: "https://www.osamigosdobairro.pt/app",
      });
      welcomeSentAt.set(user.id, Date.now());
    } catch (e) {
      console.error("[email-notifs] welcome falhou:", e);
    }
  }
  return { ok: true };
}
