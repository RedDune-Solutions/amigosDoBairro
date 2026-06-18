"use client";

import { useActionState } from "react";
import { ajustarPontos, type AdminState } from "@/lib/admin-actions";

const initial: AdminState = {};

export function AdminAdjustForm() {
  const [state, action, pending] = useActionState(ajustarPontos, initial);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl bg-white/70 p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-coffee">
        Ajustar pontos
      </h2>
      <input
        name="userId"
        placeholder="ID do utilizador (UUID)"
        required
        className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 font-mono text-xs text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="delta"
          type="number"
          placeholder="± pontos"
          required
          className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
        <input
          name="reason"
          placeholder="Motivo"
          className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
      </div>
      {state.error && <p className="text-sm font-medium text-brick">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-leaf">Pontos ajustados.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-coffee px-4 py-3 text-sm font-semibold text-cream-soft disabled:opacity-60"
      >
        {pending ? "A ajustar…" : "Aplicar ajuste"}
      </button>
    </form>
  );
}
