"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

export type AuthState = { error?: string };

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  // só caminhos internos (evita open-redirect)
  return value.startsWith("/") && !value.startsWith("//") ? value : "/app";
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email ou palavra-passe incorretos." };
  }
  redirect(safeNext(formData.get("next")));
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
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { nome: parsed.data.nome, telefone: parsed.data.telefone || null },
    },
  });
  if (error) {
    return { error: "Não foi possível criar a conta. Tenta outro email." };
  }
  redirect(safeNext(formData.get("next")));
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
  redirect("/");
}
