"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Grava a preferência "manter sessão iniciada" antes de escrever os cookies de auth. */
async function setRememberPref(remember: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("ab_remember", remember ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    ...(remember ? { maxAge: 60 * 60 * 24 * 400 } : {}),
  });
}

const credentials = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "A palavra-passe precisa de pelo menos 8 caracteres."),
});

const signUpSchema = credentials.extend({
  nome: z.string().trim().min(2, "Diz-nos o teu nome.").max(80),
  telefone: z
    .string()
    .trim()
    .regex(/^[0-9 +]{6,20}$/, "Telefone inválido.")
    .optional()
    .or(z.literal("")),
});

export type AuthState = { error?: string; sent?: boolean };

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  // só caminhos internos (evita open-redirect)
  return value.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

/** Redireciona conforme o role: staff/admin → painel; cliente → app/next. */
async function postAuthRedirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
): Promise<never> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role: string = "customer";
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = (data?.role as string) ?? "customer";
  }
  redirect(role === "admin" || role === "staff" ? "/admin" : safeNext(formData.get("next")));
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Preferência do utilizador: manter sessão (cookie persistente) ou só durante
  // a sessão do browser (cookie de sessão). Definir ANTES de escrever os cookies.
  await setRememberPref(formData.get("remember") === "1");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Distinguir credenciais erradas de problemas de serviço/confirmação,
    // para a mensagem não enganar quando o backend está em baixo.
    const status = (error as { status?: number }).status;
    const code = (error as { code?: string }).code ?? "";
    if (code === "invalid_credentials" || status === 400) {
      return { error: "Email ou palavra-passe incorretos." };
    }
    if (code === "email_not_confirmed") {
      return { error: "Confirma o teu email antes de entrar." };
    }
    if (!status) {
      // sem status HTTP = não chegou ao servidor (Supabase/Docker em baixo)
      return { error: "Serviço indisponível. Tenta novamente daqui a pouco." };
    }
    return { error: "Não foi possível entrar. Tenta novamente." };
  }
  await postAuthRedirect(supabase, formData);
  return {};
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { nome: parsed.data.nome, telefone: parsed.data.telefone || null },
    },
  });
  if (error) {
    return { error: "Não foi possível criar a conta. Tenta outro email." };
  }
  // Sem sessão = confirmação de email pendente → avisar (não redirecionar).
  // Com sessão (confirmação desligada, ex. local) → entrar normalmente.
  if (!data.session) {
    return { sent: true };
  }
  await postAuthRedirect(supabase, formData);
  return {};
}

/** Pede email de recuperação de palavra-passe. */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState & { sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email inválido." };
  const origin = String(formData.get("origin") ?? "");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/recuperar`,
  });
  // resposta neutra (não revelar se o email existe)
  return { sent: true };
}

/** Define nova palavra-passe (sessão de recovery activa). */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState & { ok?: boolean }> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "A palavra-passe precisa de pelo menos 8 caracteres." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível atualizar. Pede um novo link." };
  return { ok: true };
}

/**
 * Acção única de autenticação — encaminha para registo ou entrada conforme o
 * campo `mode` do formulário. Evita o binding preso do useActionState quando se
 * alterna entre login/registo no mesmo ecrã.
 */
export async function authenticate(
  prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = formData.get("mode");
  return mode === "register" ? signUp(prev, formData) : signIn(prev, formData);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete("ab_remember");
  redirect("/");
}
