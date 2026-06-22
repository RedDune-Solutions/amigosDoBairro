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

/** Staff lê o QR do cliente (código curto) + valor gasto → pontos + carimbos + raspadinhas. */
export async function registarCompra(
  code: string,
  euros: number,
): Promise<{ pontos?: number; cartolas?: number; error?: string }> {
  const parsed = compraSchema.safeParse({ code, euros });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registar_compra_via_code", {
    p_code: parsed.data.code,
    p_euros: parsed.data.euros,
  });
  if (error) {
    const m = error.message ?? "";
    const msg = m.includes("expirado")
      ? "Código expirado. Pede um novo."
      : m.includes("utilizado")
        ? "Código já utilizado."
        : m.includes("inválido")
          ? "Código inválido."
          : m.includes("staff")
            ? "Sem permissão."
            : "Não foi possível registar.";
    return { error: msg };
  }
  const res = data as { pontos?: number; cartolas?: number } | null;
  return { pontos: res?.pontos, cartolas: res?.cartolas };
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
