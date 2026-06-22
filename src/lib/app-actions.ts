"use server";

import { createClient } from "@/lib/supabase/server";

export async function redeemReward(
  rewardId: string,
): Promise<{ codigo?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resgatar_recompensa", {
    p_reward: rewardId,
  });
  if (error) {
    const m = error.message ?? "";
    return {
      error: m.includes("insuficientes")
        ? "Pontos insuficientes."
        : m.includes("esgotada")
          ? "Recompensa esgotada."
          : "Não foi possível resgatar.",
    };
  }
  return { codigo: String(data) };
}

export async function openScratch(
  cardId: string,
): Promise<{ prize?: Record<string, unknown>; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("abrir_raspadinha", {
    p_card: cardId,
  });
  if (error) {
    return { error: "Não foi possível abrir." };
  }
  return { prize: data as Record<string, unknown> };
}

export async function updateProfile(input: {
  nome: string;
  telefone: string;
  avatar_url?: string | null;
}): Promise<{ ok?: boolean; error?: string }> {
  const nome = input.nome.trim();
  const telefone = input.telefone.trim();
  if (nome.length < 2) return { error: "Nome demasiado curto." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const patch: { nome: string; telefone: string | null; avatar_url?: string | null } = {
    nome,
    telefone: telefone || null,
  };
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

export async function createReservation(input: {
  data: string;
  hora: string;
  n_pessoas: number;
}): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const today = new Date().toISOString().slice(0, 10);
  if (input.data < today) return { error: "Data no passado." };
  if (input.n_pessoas < 1 || input.n_pessoas > 12) return { error: "Nº de pessoas inválido." };
  const { error } = await supabase.from("reservations").insert({
    user_id: user.id,
    data: input.data,
    hora: input.hora,
    n_pessoas: input.n_pessoas,
  });
  if (error) return { error: "Não foi possível reservar." };
  return { ok: true };
}
