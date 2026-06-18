"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/auth-actions";
import { Sparkle } from "@/components/icons";

const initial: AuthState = {};

export function AuthForm({
  mode,
  next,
}: {
  mode: "entrar" | "registo";
  next?: string;
}) {
  const action = mode === "entrar" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {mode === "registo" && (
        <>
          <Field label="Nome" name="nome" type="text" autoComplete="name" required />
          <Field
            label="Telefone (opcional)"
            name="telefone"
            type="tel"
            autoComplete="tel"
          />
        </>
      )}

      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Palavra-passe"
        name="password"
        type="password"
        autoComplete={mode === "entrar" ? "current-password" : "new-password"}
        required
      />

      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-brick/10 px-3.5 py-2.5 text-sm font-medium text-brick"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange to-orange-deep px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        <Sparkle className="h-5 w-5" />
        {pending
          ? "A processar…"
          : mode === "entrar"
            ? "Entrar"
            : "Criar conta grátis"}
      </button>

      <p className="text-center text-sm text-coffee-soft">
        {mode === "entrar" ? (
          <>
            Ainda não és membro?{" "}
            <Link href="/registo" className="font-semibold text-orange-deep">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tens conta?{" "}
            <Link href="/entrar" className="font-semibold text-orange-deep">
              Entrar
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-coffee">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="rounded-xl border border-coffee/10 bg-white/80 px-4 py-3 text-coffee outline-none transition placeholder:text-coffee-soft/60 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />
    </label>
  );
}
