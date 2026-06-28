"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const compraSchema = z.object({
  code: z
    .string()
    .trim()
    .pipe(z.string().regex(/^[0-9]{4,8}$/, "Código inválido.")),
  // Aceita cêntimos (ex.: 8.30). Vírgula é normalizada para ponto no componente.
  euros: z.coerce.number().gt(0, "Valor inválido.").max(1000, "Máximo 1000€."),
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

/** Staff lê o código do cliente + valor gasto → pontos (€×10) + carimbo (≥15€).
 *  Check-in opcional na mesma operação (1/dia por cliente). */
export async function registarCompra(
  code: string,
  euros: number,
  checkin = false,
): Promise<{ pontos?: number; carimbo?: boolean; cartola?: boolean; checkin?: boolean; checkinAlready?: boolean; error?: string }> {
  const parsed = compraSchema.safeParse({ code, euros });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registar_compra_via_code_v3", {
    p_code: parsed.data.code,
    p_euros: parsed.data.euros,
    p_checkin: checkin,
  });
  if (error) return { error: mapNonceError(error.message ?? "") };
  const res = data as { pontos?: number; carimbo?: boolean; cartola?: boolean; checkin?: boolean; checkin_already?: boolean } | null;
  return { pontos: res?.pontos, carimbo: res?.carimbo, cartola: res?.cartola, checkin: res?.checkin, checkinAlready: res?.checkin_already };
}

/** Staff lê o código do cliente → check-in do dia (+10 pts, 1/dia). */
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

/** Estado do check-in de um código SEM o consumir (para desativar a checkbox). */
export async function estadoCheckin(code: string): Promise<{ valid: boolean; already: boolean }> {
  const c = z.string().trim().regex(/^[0-9]{4,8}$/);
  const parsed = c.safeParse(code);
  if (!parsed.success) return { valid: false, already: false };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkin_estado_por_code", { p_code: parsed.data });
  if (error) return { valid: false, already: false };
  const res = data as { valid?: boolean; already?: boolean } | null;
  return { valid: Boolean(res?.valid), already: Boolean(res?.already) };
}

/** Valida um voucher por código (raspadinha ou resgate de pontos).
 *  Tolerante ao formato: ignora traços/espaços e maiúsculas, e tenta as formas
 *  canónicas — raspadinha `AB-XXXX` e resgate `XXXXXX` (sem traço). Assim o staff
 *  pode escrever com ou sem o traço. Só o código certo é que é consumido
 *  (os outros candidatos só dão erro, sem efeito). */
export async function validarVoucher(codigo: string): Promise<{ ok?: boolean; error?: string }> {
  const raw = codigo.trim().toUpperCase().replace(/\s+/g, "");
  const alnum = raw.replace(/-/g, "");
  if (alnum.length < 4) return { error: "Código inválido." };
  const candidates = Array.from(
    new Set(
      [
        raw, // como foi escrito
        alnum, // sem traço (resgate)
        /^[A-Z]{2}[0-9A-Z]{4,}$/.test(alnum) ? `${alnum.slice(0, 2)}-${alnum.slice(2)}` : null, // raspadinha AB-XXXX
      ].filter(Boolean) as string[],
    ),
  );
  const supabase = await createClient();
  for (const c of candidates) {
    const wallet = await supabase.rpc("usar_carteira", { p_codigo: c });
    if (!wallet.error) return { ok: true };
  }
  for (const c of candidates) {
    const red = await supabase.rpc("marcar_levantado", { p_codigo: c });
    if (!red.error) return { ok: true };
  }
  return { error: "Código inválido ou já usado." };
}
