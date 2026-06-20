"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

async function assertStaff() {
  const { profile } = await getProfile();
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) throw new Error("forbidden");
}

const patchSchema = z.object({
  id: z.string(),
  nome_pt: z.string().trim().max(80).optional(),
  nome_en: z.string().trim().max(80).optional(),
  desc_pt: z.string().trim().max(160).optional(),
  desc_en: z.string().trim().max(160).optional(),
  icon: z.string().max(20).optional(),
  accent: z.enum(["primary", "green", "blue", "red"]).optional(),
  weight: z.coerce.number().int().min(1).max(1000).optional(),
  stock: z.coerce.number().int().min(0).max(100000).optional(),
});

export async function patchPrize(
  input: z.input<typeof patchSchema>,
): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = patchSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("prizes").update(fields).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function addPrize(kind: "comum" | "especial"): Promise<{ id?: string; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const id = "n_" + Date.now().toString(36);
  const { error } = await supabase.from("prizes").insert({
    id,
    kind,
    nome_pt: "Novo prémio",
    nome_en: "New prize",
    icon: "gift",
    accent: kind === "especial" ? "primary" : "green",
    weight: 10,
    stock: 20,
  });
  if (error) return { error: "Não foi possível adicionar." };
  return { id };
}

export async function removePrize(id: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("prizes").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover." };
  return { ok: true };
}

export async function updateLoyalty(
  euroPerStamp: number,
  stampGoal: number,
): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  if (euroPerStamp < 1 || stampGoal < 2) return { error: "Valores inválidos." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("loyalty_config")
    .update({ euro_per_stamp: euroPerStamp, stamp_goal: stampGoal })
    .eq("id", true);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

/** Confirmar / cancelar reserva (staff ou admin). */
export async function atualizarReserva(formData: FormData): Promise<void> {
  await assertStaff();
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado"));
  if (!["pendente", "confirmada", "cancelada"].includes(estado)) return;
  const supabase = await createClient();
  await supabase.from("reservations").update({ estado }).eq("id", id);
  revalidatePath("/admin");
}

/** Valida um voucher por código: tenta carteira (raspadinha) e depois resgate de pontos. */
export async function validateVoucher(codigo: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const code = codigo.trim().toUpperCase();
  if (code.length < 4) return { error: "Código inválido." };
  const supabase = await createClient();
  const wallet = await supabase.rpc("usar_carteira", { p_codigo: code });
  if (!wallet.error) return { ok: true };
  const red = await supabase.rpc("marcar_levantado", { p_codigo: code });
  if (!red.error) return { ok: true };
  return { error: "Código inválido ou já usado." };
}
