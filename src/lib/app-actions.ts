"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToStaff } from "@/lib/push-send";
import { sendNovaReservaEmail } from "@/lib/email-send";

export async function redeemReward(
  rewardId: string,
): Promise<{ codigo?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resgatar_recompensa_v2", {
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

/** Reclama, na 1ª vez, o bónus de registo (+150). O login diário já não dá pontos. */
export async function reclamarLoginDiario(): Promise<{ login?: boolean; signup?: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reclamar_login_diario_v2");
  if (error) return {};
  const r = data as { login?: boolean; signup?: boolean } | null;
  return { login: r?.login, signup: r?.signup };
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
  food_pref?: string | null;
}): Promise<{ ok?: boolean; error?: string }> {
  const nome = input.nome.trim();
  const telefone = input.telefone.trim();
  if (nome.length < 2) return { error: "Nome demasiado curto." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const patch: { nome: string; telefone: string | null; avatar_url?: string | null; food_pref?: string | null } = {
    nome,
    telefone: telefone || null,
  };
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;
  if (input.food_pref !== undefined) patch.food_pref = input.food_pref || null;
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: "Não foi possível guardar." };
  return { ok: true };
}

/** Cliente arquiva uma reserva (ex.: recusada) — só mexe em `arquivada` (guard trigger). */
export async function arquivarReserva(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const { error } = await supabase.from("reservations").update({ arquivada: true }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Não foi possível arquivar." };
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
  const { data: prof } = await supabase.from("profiles").select("reservas_bloqueadas").eq("id", user.id).single();
  if (prof?.reservas_bloqueadas) return { error: "O café bloqueou as reservas desta conta. Fala connosco." };
  const today = new Date().toISOString().slice(0, 10);
  if (input.data < today) return { error: "Data no passado." };
  if (input.n_pessoas < 1 || input.n_pessoas > 12) return { error: "Nº de pessoas inválido." };
  const { error } = await supabase.from("reservations").insert({
    user_id: user.id,
    data: input.data,
    hora: input.hora,
    n_pessoas: input.n_pessoas,
  });
  if (error) {
    const m = error.message ?? "";
    return {
      error: m.includes("bloqueadas")
        ? "O café bloqueou as reservas desta conta. Fala connosco."
        : m.includes("esse dia")
          ? "Já tens uma reserva para esse dia. Cancela-a para pedir outra."
          : "Não foi possível reservar.",
    };
  }

  // Avisar a equipa (email + push) DEPOIS da resposta ao cliente — after() corre
  // pós-response (na Vercel via waitUntil). Best-effort: falhar o aviso nunca
  // falha a reserva já criada.
  const email = user.email ?? "";
  after(async () => {
    try {
      const { data: quem } = await supabase.from("profiles").select("nome, telefone").eq("id", user.id).single();
      const nome = quem?.nome ?? "Cliente";
      const dataFmt = new Date(input.data + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
      await Promise.allSettled([
        sendNovaReservaEmail({
          clienteNome: nome,
          clienteEmail: email,
          clienteTelefone: quem?.telefone ?? "",
          data: input.data,
          hora: input.hora,
          nPessoas: input.n_pessoas,
        }),
        sendPushToStaff({
          title: "Nova reserva",
          body: `${nome} · ${dataFmt} ${input.hora.slice(0, 5)} · ${input.n_pessoas} pax`,
          url: "/admin",
        }),
      ]);
    } catch (e) {
      console.error("[reserva] aviso à equipa falhou:", e);
    }
  });
  return { ok: true };
}
