"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { notificarCliente } from "@/lib/notify-cliente";

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
});

/** Soma dos pesos (%) dos prémios activos de uma pool, opcionalmente excluindo um id. */
async function poolWeightSum(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: string,
  excludeId?: string,
): Promise<number> {
  let q = supabase.from("prizes").select("weight").eq("kind", kind).eq("ativo", true);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q;
  return (data ?? []).reduce((s, p) => s + (p.weight as number), 0);
}

export async function patchPrize(
  input: z.input<typeof patchSchema>,
): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = patchSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  // A probabilidade é absoluta: a soma da pool não pode exceder 100%.
  if (fields.weight !== undefined) {
    const { data: row } = await supabase.from("prizes").select("kind").eq("id", id).single();
    if (row) {
      const others = await poolWeightSum(supabase, row.kind as string, id);
      if (others + fields.weight > 100) return { error: "Excede 100% na pool." };
    }
  }
  const { error } = await supabase.from("prizes").update(fields).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function addPrize(kind: "comum" | "especial"): Promise<{ id?: string; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const sum = await poolWeightSum(supabase, kind);
  const weight = Math.max(1, Math.min(10, 100 - sum));
  const id = "n_" + Date.now().toString(36);
  const { error } = await supabase.from("prizes").insert({
    id,
    kind,
    nome_pt: "Novo prémio",
    nome_en: "New prize",
    icon: "gift",
    accent: kind === "especial" ? "primary" : "green",
    weight,
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

// ---------- Recompensas de pontos (catálogo `rewards`) ----------------------
const rewardSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().trim().max(80).optional(),
  nome_en: z.string().trim().max(80).optional(),
  descricao: z.string().trim().max(160).optional(),
  desc_en: z.string().trim().max(160).optional(),
  custo_pontos: z.coerce.number().int().min(1).max(100000).optional(),
  icon: z.string().max(20).optional(),
  accent: z.enum(["primary", "green", "blue", "red"]).optional(),
  ativo: z.boolean().optional(),
});

export async function patchReward(
  input: z.input<typeof rewardSchema>,
): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };
  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("rewards").update(fields).eq("id", id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function addReward(): Promise<{ id?: string; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .insert({
      titulo: "Nova recompensa",
      nome_en: "New reward",
      custo_pontos: 100,
      icon: "gift",
      accent: "primary",
      ativo: true,
    })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível adicionar." };
  return { id: data.id as string };
}

export async function removeReward(id: string): Promise<{ ok?: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("rewards").delete().eq("id", id);
  if (error) return { error: "Não foi possível remover." };
  return { ok: true };
}

/** Confirmar / cancelar reserva (staff ou admin). Notifica o cliente: a
 *  notificação in-app é criada por trigger; aqui enviamos o push ao telemóvel. */
export async function atualizarReserva(formData: FormData): Promise<void> {
  await assertStaff();
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado"));
  if (!["pendente", "confirmada", "cancelada"].includes(estado)) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("reservations")
    .select("user_id, data, hora, n_pessoas, estado")
    .eq("id", id)
    .single();
  if (!row) return;
  if (row.estado === estado) {
    revalidatePath("/admin");
    return;
  }
  await supabase.from("reservations").update({ estado }).eq("id", id);
  revalidatePath("/admin");

  // Push + email ao cliente quando o staff responde (confirmar/recusar).
  if (estado === "confirmada" || estado === "cancelada") {
    const dia = String(row.data).slice(8, 10) + "/" + String(row.data).slice(5, 7);
    const hora = String(row.hora).slice(0, 5);
    const detalhe = `${dia} · ${hora} · ${row.n_pessoas} pax`;
    const payload =
      estado === "confirmada"
        ? { title: "Reserva confirmada ✓", body: `Mesa para ${detalhe}. Até já!`, url: "/app", emailAssunto: `Reserva confirmada · ${dia} ${hora}` }
        : { title: "Reserva não disponível", body: `O café não pôde confirmar a tua reserva de ${dia} · ${hora}.`, url: "/app", emailAssunto: `Reserva não disponível · ${dia} ${hora}` };
    await notificarCliente(row.user_id as string, payload);
  }
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
