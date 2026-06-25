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
