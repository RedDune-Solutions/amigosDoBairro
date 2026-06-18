"use client";

import { useActionState } from "react";
import { criarReserva, type ReservaState } from "@/lib/reservation-actions";
import { Calendar } from "@/components/icons";

const initial: ReservaState = {};

export function ReservationForm() {
  const [state, action, pending] = useActionState(criarReserva, initial);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl bg-white/70 p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-coffee">Data</span>
          <input
            name="data"
            type="date"
            min={hoje}
            required
            className="rounded-xl border border-coffee/10 bg-white/80 px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-coffee">Hora</span>
          <input
            name="hora"
            type="time"
            required
            className="rounded-xl border border-coffee/10 bg-white/80 px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-coffee">Nº de pessoas</span>
        <input
          name="n_pessoas"
          type="number"
          min={1}
          max={20}
          defaultValue={2}
          required
          className="rounded-xl border border-coffee/10 bg-white/80 px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-coffee">Notas (opcional)</span>
        <textarea
          name="notas"
          rows={2}
          maxLength={300}
          placeholder="Ex.: mesa junto à janela"
          className="resize-none rounded-xl border border-coffee/10 bg-white/80 px-3 py-2.5 text-coffee outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-brick">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-xl bg-leaf/15 px-3 py-2 text-sm font-medium text-leaf">
          Reserva enviada! Vais receber a confirmação do café.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange to-orange-deep px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        <Calendar className="h-5 w-5" />
        {pending ? "A enviar…" : "Reservar mesa"}
      </button>
    </form>
  );
}
