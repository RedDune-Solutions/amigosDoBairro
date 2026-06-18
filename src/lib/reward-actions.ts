"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type RedeemState = { codigo?: string; error?: string };

const schema = z.object({ rewardId: z.string().uuid() });

export async function resgatar(
  _prev: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const parsed = schema.safeParse({ rewardId: formData.get("rewardId") });
  if (!parsed.success) return { error: "Recompensa inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resgatar_recompensa", {
    p_reward: parsed.data.rewardId,
  });

  if (error) {
    // mensagens vindas das RPC (RAISE EXCEPTION) são seguras de mostrar
    const msg = error.message?.includes("insuficientes")
      ? "Pontos insuficientes para esta recompensa."
      : error.message?.includes("esgotada")
        ? "Recompensa esgotada."
        : "Não foi possível resgatar. Tenta novamente.";
    return { error: msg };
  }

  revalidatePath("/recompensas");
  revalidatePath("/app");
  revalidatePath("/perfil");
  return { codigo: String(data) };
}
