"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const compraSchema = z.object({
  code: z
    .string()
    .trim()
    .pipe(z.string().regex(/^[0-9]{4,8}$/, "Código inválido.")),
  euros: z.coerce.number().int().min(1, "Mínimo 1€.").max(1000, "Máximo 1000€."),
});

function mapNonceError(m: string): string {
  return m.includes("expirado")
    ? "Código expirado. Pede um novo."
    : m.includes("utilizado")
      ? "Código já utilizado."
      : m.includes("inválido")
        ? "Código inválido."
        : m.includes("staff") || m.includes("permissão")
          ? "Sem permissão."
          : m.includes("hoje")
            ? "Check-in já feito hoje."
            : "Não foi possível registar.";
}

/** Staff lê o código do cliente + valor gasto → pontos (€×10) + carimbo (≥15€). */
export async function registarCompra(
  code: string,
  euros: number,
): Promise<{ pontos?: number; carimbo?: boolean; cartola?: boolean; error?: string }> {
  const parsed = compraSchema.safeParse({ code, euros });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registar_compra_via_code_v2", {
    p_code: parsed.data.code,
    p_euros: parsed.data.euros,
  });
  if (error) return { error: mapNonceError(error.message ?? "") };
  const res = data as { pontos?: number; carimbo?: boolean; cartola?: boolean } | null;
  return { pontos: res?.pontos, carimbo: res?.carimbo, cartola: res?.cartola };
}

/** Staff lê o código do cliente → check-in do dia (+20 pts, 1/dia). */
export async function registarCheckin(code: string): Promise<{ pontos?: number; error?: string }> {
  const c = z.string().trim().regex(/^[0-9]{4,8}$/);
  const parsed = c.safeParse(code);
  if (!parsed.success) return { error: "Código inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkin_via_code_v2", { p_code: parsed.data });
  if (error) return { error: mapNonceError(error.message ?? "") };
  const res = data as { pontos?: number } | null;
  return { pontos: res?.pontos };
}

/** Valida um voucher por código (raspadinha ou resgate de pontos). */
export async function validarVoucher(codigo: string): Promise<{ ok?: boolean; error?: string }> {
  const code = codigo.trim().toUpperCase();
  if (code.length < 4) return { error: "Código inválido." };
  const supabase = await createClient();
  const wallet = await supabase.rpc("usar_carteira", { p_codigo: code });
  if (!wallet.error) return { ok: true };
  const red = await supabase.rpc("marcar_levantado", { p_codigo: code });
  if (!red.error) return { ok: true };
  return { error: "Código inválido ou já usado." };
}
