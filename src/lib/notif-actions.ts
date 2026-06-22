"use server";

import { createClient } from "@/lib/supabase/server";

/** Marca como lidas todas as notificações por ler do utilizador. */
export async function marcarNotificacoesLidas(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
}

/** Arquiva uma notificação (deixa de aparecer na lista). RLS garante dono. */
export async function arquivarNotificacao(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Não foi possível arquivar." };
  return { ok: true };
}
