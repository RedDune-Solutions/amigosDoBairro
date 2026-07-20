"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { sendPushToUser } from "@/lib/push-send";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

const avisoSchema = z.object({
  userId: z.string().uuid(),
  titulo: z.string().trim().min(2).max(80),
  corpo: z.string().trim().max(300).optional().or(z.literal("")),
});

/** Envia um aviso a um cliente: notificação in-app (RPC) + push no telemóvel. */
export async function enviarAviso(input: z.input<typeof avisoSchema>): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = avisoSchema.safeParse(input);
  if (!parsed.success) return { error: "Preenche o título (mín. 2 letras)." };
  const { userId, titulo, corpo } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_enviar_aviso", { p_user: userId, p_titulo: titulo, p_corpo: corpo || "" });
  if (error) return { error: "Não foi possível enviar o aviso." };
  // Push best-effort (não falha o aviso se o cliente não tiver push ativo).
  await sendPushToUser(userId, { title: titulo, body: corpo || "Tens um aviso do café.", url: "/app" });
  return { ok: true };
}

const ofertaSchema = z
  .object({
    userId: z.string().uuid(),
    carimbos: z.coerce.number().int().min(0).max(10),
    comum: z.coerce.number().int().min(0).max(10),
    especial: z.coerce.number().int().min(0).max(10),
  })
  .refine((o) => o.carimbos + o.comum + o.especial > 0, { message: "vazia" });

/** Oferta manual do admin: carimbos e/ou raspadinhas (comum/especial) num só passo.
 *  Carimbos não contam para o teto de 2/semana; a cada 10 o cartão reinicia e gera
 *  2 raspadinhas (comum + especial), igual à compra. */
export async function darOferta(
  input: z.input<typeof ofertaSchema>,
): Promise<{ ok?: boolean; stamps?: number; cartolas?: number; error?: string }> {
  await assertAdmin();
  const parsed = ofertaSchema.safeParse(input);
  if (!parsed.success) return { error: "Escolhe pelo menos 1 carimbo ou raspadinha (máx. 10 de cada)." };
  const { userId, carimbos, comum, especial } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dar_oferta", {
    p_user: userId,
    p_carimbos: carimbos,
    p_comum: comum,
    p_especial: especial,
  });
  if (error) {
    const m = error.message ?? "";
    return { error: m.includes("clientes") ? "Só contas de cliente." : "Não foi possível dar a oferta." };
  }
  const res = data as { stamps?: number; cartolas?: number } | null;
  const cartolas = res?.cartolas ?? 0;
  const raspadinhas = comum + especial + cartolas * 2;
  const partes = [
    carimbos > 0 ? `${carimbos} carimbo${carimbos > 1 ? "s" : ""}` : null,
    raspadinhas > 0 ? `${raspadinhas} raspadinha${raspadinhas > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  // Push best-effort — não falha a operação se o cliente não tiver push ativo.
  await sendPushToUser(userId, {
    title: "Recebeste uma oferta 🎁",
    body: `+${partes.join(" · ")} do café.`,
    url: "/app",
  });
  return { ok: true, stamps: res?.stamps, cartolas };
}

const resBlockSchema = z.object({ userId: z.string().uuid(), bloq: z.boolean() });

/** Bloqueia/permite SÓ as reservas de um cliente (no-show), sem suspender a conta. */
export async function definirReservasBloqueadas(input: z.input<typeof resBlockSchema>): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = resBlockSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("definir_reservas_bloqueadas", { p_user: parsed.data.userId, p_bloq: parsed.data.bloq });
  if (error) return { error: (error.message ?? "").includes("clientes") ? "Só contas de cliente." : "Não foi possível atualizar." };
  return { ok: true };
}

const banSchema = z.object({ userId: z.string().uuid(), banned: z.boolean() });

/** Suspende (banned=true) ou reativa (false) a conta de um cliente. */
export async function definirSuspensao(input: z.input<typeof banSchema>): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("definir_banido", { p_user: parsed.data.userId, p_banned: parsed.data.banned });
  if (error) {
    return { error: (error.message ?? "").includes("clientes") ? "Só contas de cliente podem ser suspensas." : "Não foi possível atualizar." };
  }
  return { ok: true };
}
