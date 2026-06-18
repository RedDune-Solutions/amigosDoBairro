"use client";

import { useActionState } from "react";
import { resgatar, type RedeemState } from "@/lib/reward-actions";

const initial: RedeemState = {};

export function RedeemButton({
  rewardId,
  cost,
  affordable,
}: {
  rewardId: string;
  cost: number;
  affordable: boolean;
}) {
  const [state, action, pending] = useActionState(resgatar, initial);

  if (state.codigo) {
    return (
      <div className="rounded-xl bg-leaf/15 px-3 py-2 text-center">
        <p className="text-xs font-medium text-coffee-soft">Código de levantamento</p>
        <p className="font-display text-xl font-bold tracking-widest text-leaf">
          {state.codigo}
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="rewardId" value={rewardId} />
      <button
        type="submit"
        disabled={pending || !affordable}
        className="w-full rounded-xl bg-gradient-to-r from-orange to-orange-deep px-4 py-2.5 text-sm font-semibold text-white shadow transition active:scale-[0.99] disabled:cursor-not-allowed disabled:from-coffee/20 disabled:to-coffee/20 disabled:text-coffee-soft disabled:shadow-none"
      >
        {pending
          ? "A resgatar…"
          : affordable
            ? `Resgatar · ${cost} pts`
            : `Faltam pontos`}
      </button>
      {state.error && (
        <p className="mt-1.5 text-center text-xs font-medium text-brick">
          {state.error}
        </p>
      )}
    </form>
  );
}
