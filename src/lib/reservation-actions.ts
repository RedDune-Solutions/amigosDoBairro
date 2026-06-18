"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ReservaState = { ok?: boolean; error?: string };

const schema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
  n_pessoas: z.coerce.number().int().min(1, "Mínimo 1 pessoa.").max(20, "Máximo 20 pessoas."),
  notas: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function criarReserva(
  _prev: ReservaState,
  formData: FormData,
): Promise<ReservaState> {
  const parsed = schema.safeParse({
    data: formData.get("data"),
    hora: formData.get("hora"),
    n_pessoas: formData.get("n_pessoas"),
    notas: formData.get("notas"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const hoje = new Date().toISOString().slice(0, 10);
  if (parsed.data.data < hoje) {
    return { error: "A data tem de ser hoje ou no futuro." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entra novamente." };

  const { error } = await supabase.from("reservations").insert({
    user_id: user.id,
    data: parsed.data.data,
    hora: parsed.data.hora,
    n_pessoas: parsed.data.n_pessoas,
    notas: parsed.data.notas || null,
  });
  if (error) {
    return { error: "Não foi possível criar a reserva. Tenta novamente." };
  }

  revalidatePath("/reservar");
  return { ok: true };
}
