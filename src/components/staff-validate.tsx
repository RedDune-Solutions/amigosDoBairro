"use client";

import { useActionState } from "react";
import { validarResgate, type ValidateState } from "@/lib/staff-actions";

const initial: ValidateState = {};

export function StaffValidate() {
  const [state, action, pending] = useActionState(validarResgate, initial);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-coffee">
        Validar resgate
      </h2>
      <form action={action} className="flex flex-col gap-3">
        <input
          name="codigo"
          placeholder="Código (ex.: A1B2C3)"
          required
          className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 font-mono uppercase tracking-widest text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
        {state.error && <p className="text-sm font-medium text-brick">{state.error}</p>}
        {state.ok && (
          <p className="rounded-xl bg-leaf/15 px-3 py-2 text-sm font-medium text-leaf">
            Resgate validado. Pode entregar.
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-coffee px-4 py-3 text-sm font-semibold text-cream-soft transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "A validar…" : "Marcar como levantado"}
        </button>
      </form>
    </div>
  );
}
