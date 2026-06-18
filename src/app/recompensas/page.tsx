import { getProfile, getBalance } from "@/lib/data";
import { RedeemButton } from "@/components/redeem-button";
import { Gift } from "@/components/icons";
import type { Reward } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecompensasPage() {
  const [{ supabase }, saldo] = await Promise.all([getProfile(), getBalance()]);
  const { data } = await supabase
    .from("rewards")
    .select("*")
    .eq("ativo", true)
    .order("custo_pontos", { ascending: true });
  const rewards = (data ?? []) as Reward[];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-coffee">
          Recompensas
        </h1>
        <span className="rounded-full bg-terracotta/15 px-3 py-1.5 text-sm font-semibold text-terracotta">
          {saldo} pts
        </span>
      </header>

      {rewards.length === 0 ? (
        <p className="rounded-2xl bg-white/70 p-6 text-center text-sm text-coffee-soft">
          Ainda não há recompensas disponíveis. Volta em breve!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rewards.map((r) => {
            const affordable = saldo >= r.custo_pontos;
            const esgotado = r.stock !== null && r.stock <= 0;
            return (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-grape/15 text-grape">
                    <Gift className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-coffee">{r.titulo}</p>
                    {r.descricao && (
                      <p className="text-[13px] leading-snug text-coffee-soft">
                        {r.descricao}
                      </p>
                    )}
                  </div>
                </div>
                {esgotado ? (
                  <p className="rounded-xl bg-coffee/5 py-2 text-center text-sm font-medium text-coffee-soft">
                    Esgotado
                  </p>
                ) : (
                  <RedeemButton
                    rewardId={r.id}
                    cost={r.custo_pontos}
                    affordable={affordable}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
