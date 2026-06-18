import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Devolve o utilizador autenticado ou redireciona para /entrar. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

/** Perfil do utilizador autenticado (cria-se via trigger no signup). */
export async function getProfile(): Promise<{
  profile: Profile | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { profile: data as Profile | null, supabase };
}

/** Saldo de pontos do próprio utilizador (via RPC segura). */
export async function getBalance(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("meu_saldo");
  return typeof data === "number" ? data : 0;
}

/** Garante que o utilizador é staff/admin; senão redireciona. */
export async function requireStaff(): Promise<Profile> {
  const { profile } = await getProfile();
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/app");
  }
  return profile;
}

/** Garante que o utilizador é admin; senão redireciona. */
export async function requireAdmin(): Promise<Profile> {
  const { profile } = await getProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/app");
  }
  return profile;
}
