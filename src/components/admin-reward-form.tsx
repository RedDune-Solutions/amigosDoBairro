"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarRecompensa, type AdminState } from "@/lib/admin-actions";

const initial: AdminState = {};

export function AdminRewardForm() {
  const [state, action, pending] = useActionState(criarRecompensa, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={ref}
      action={action}
      className="flex flex-col gap-3 rounded-2xl bg-white/70 p-5 shadow-sm"
    >
      <h2 className="font-display text-lg font-semibold text-coffee">
        Nova recompensa
      </h2>
      <input
        name="titulo"
        placeholder="Título (ex.: Café grátis)"
        required
        className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />
      <input
        name="descricao"
        placeholder="Descrição (opcional)"
        className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="custo_pontos"
          type="number"
          min={1}
          placeholder="Custo (pts)"
          required
          className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
        <input
          name="stock"
          type="number"
          min={0}
          placeholder="Stock (vazio = ∞)"
          className="rounded-xl border border-coffee/10 bg-white px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
      </div>
      {state.error && <p className="text-sm font-medium text-brick">{state.error}</p>}
      {state.ok && (
        <p className="text-sm font-medium text-leaf">Recompensa criada.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-orange to-orange-deep px-4 py-3 text-sm font-semibold text-white shadow disabled:opacity-60"
      >
        {pending ? "A criar…" : "Criar recompensa"}
      </button>
    </form>
  );
}
