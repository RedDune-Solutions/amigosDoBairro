"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { vapidReady, sendToSubs, type PushSub } from "@/lib/push-send";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

/** Cliente guarda a subscription do seu dispositivo (upsert por endpoint). */
export async function savePushSubscription(sub: z.input<typeof subSchema>): Promise<{ ok?: boolean; error?: string }> {
  const parsed = subSchema.safeParse(sub);
  if (!parsed.success) return { error: "Subscription inválida." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
      { onConflict: "endpoint" },
    );
  if (error) return { error: "Não foi possível ativar." };
  return { ok: true };
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

/** Admin envia uma campanha push, opcionalmente só a um segmento (food_pref). */
export async function enviarCampanha(input: z.input<typeof campSchema>): Promise<{ enviados?: number; alvo?: number; error?: string }> {
  await assertAdmin();
  const parsed = campSchema.safeParse(input);
  if (!parsed.success) return { error: "Preenche o título e a mensagem." };
  if (!vapidReady()) return { error: "Falta a chave VAPID_PRIVATE_KEY na Vercel." };

  const { titulo, corpo, segmento, url } = parsed.data;
  const supabase = await createClient();

  let q = supabase.from("push_subscriptions").select("endpoint, p256dh, auth, profiles!inner(food_pref)");
  if (segmento) q = q.eq("profiles.food_pref", segmento);
  const { data: rows, error } = await q;
  if (error) return { error: "Não foi possível ler os subscritores." };

  const subs: PushSub[] = (rows ?? []).map((s) => ({
    endpoint: s.endpoint as string,
    p256dh: s.p256dh as string,
    auth: s.auth as string,
  }));
  if (subs.length === 0) return { enviados: 0, alvo: 0, error: "Ninguém ativou as notificações neste segmento ainda." };

  const { enviados, stale } = await sendToSubs(subs, { title: titulo, body: corpo, url });

  if (stale.length) await supabase.from("push_subscriptions").delete().in("endpoint", stale);

  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("push_campaigns").insert({
    titulo, corpo, segmento: segmento || null, url: url || null, enviados, created_by: user?.id ?? null,
  });

  return { enviados, alvo: subs.length };
}
