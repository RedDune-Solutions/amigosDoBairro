"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";

async function assertStaff() {
  const { profile } = await getProfile();
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    throw new Error("forbidden");
  }
}

export type CreditState = { pontos?: number; error?: string };

const creditSchema = z.object({
  nonce: z.string().uuid("Código inválido."),
  pontos: z.coerce.number().int().min(1, "Mínimo 1 ponto.").max(100, "Máximo 100 pontos."),
});

export async function creditarNonce(
  _prev: CreditState,
  formData: FormData,
): Promise<CreditState> {
  await assertStaff();
  const parsed = creditSchema.safeParse({
    nonce: formData.get("nonce"),
    pontos: formData.get("pontos"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("creditar_via_nonce", {
    p_nonce: parsed.data.nonce,
    p_pontos: parsed.data.pontos,
  });
  if (error) {
    const m = error.message ?? "";
    const msg = m.includes("expirado")
      ? "Código expirado. Pede ao cliente para gerar outro."
      : m.includes("utilizado")
        ? "Código já utilizado."
        : m.includes("inválido")
          ? "Código inválido."
          : "Não foi possível creditar.";
    return { error: msg };
  }
  return { pontos: Number(data) };
}

export type ValidateState = { ok?: boolean; error?: string };

const codeSchema = z.object({
  codigo: z.string().trim().min(4).max(12),
});

export async function validarResgate(
  _prev: ValidateState,
  formData: FormData,
): Promise<ValidateState> {
  await assertStaff();
  const parsed = codeSchema.safeParse({ codigo: formData.get("codigo") });
  if (!parsed.success) return { error: "Código inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("marcar_levantado", {
    p_codigo: parsed.data.codigo.toUpperCase(),
  });
  if (error) {
    return { error: "Código inválido ou já levantado." };
  }
  revalidatePath("/staff");
  return { ok: true };
}
