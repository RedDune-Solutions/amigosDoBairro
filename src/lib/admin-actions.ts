"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";

async function assertAdmin() {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("forbidden");
}

export type AdminState = { ok?: boolean; error?: string };

const rewardSchema = z.object({
  titulo: z.string().trim().min(2).max(80),
  descricao: z.string().trim().max(200).optional().or(z.literal("")),
  custo_pontos: z.coerce.number().int().min(1).max(100000),
  stock: z.coerce.number().int().min(0).max(100000).optional().or(z.literal("")),
});

export async function criarRecompensa(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await assertAdmin();
  const parsed = rewardSchema.safeParse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    custo_pontos: formData.get("custo_pontos"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) return { error: "Dados da recompensa inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("rewards").insert({
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    custo_pontos: parsed.data.custo_pontos,
    stock: parsed.data.stock === "" || parsed.data.stock === undefined ? null : parsed.data.stock,
  });
  if (error) return { error: "Não foi possível criar a recompensa." };
  revalidatePath("/admin");
  revalidatePath("/recompensas");
  return { ok: true };
}

export async function alternarRecompensa(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  const supabase = await createClient();
  await supabase.from("rewards").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/recompensas");
}

export async function apagarRecompensa(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("rewards").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/recompensas");
}

const ajusteSchema = z.object({
  userId: z.string().uuid("Utilizador inválido."),
  delta: z.coerce.number().int().refine((n) => n !== 0, "Não pode ser zero."),
  reason: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function ajustarPontos(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await assertAdmin();
  const parsed = ajusteSchema.safeParse({
    userId: formData.get("userId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("ajustar_pontos", {
    p_user: parsed.data.userId,
    p_delta: parsed.data.delta,
    p_reason: parsed.data.reason || "Ajuste manual",
  });
  if (error) return { error: "Não foi possível ajustar os pontos." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function atualizarReserva(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado"));
  if (!["pendente", "confirmada", "cancelada"].includes(estado)) return;
  const supabase = await createClient();
  await supabase.from("reservations").update({ estado }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/staff");
}
