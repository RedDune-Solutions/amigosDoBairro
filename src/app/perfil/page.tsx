import Link from "next/link";
import { getProfile, getBalance } from "@/lib/data";
import { signOut } from "@/lib/auth-actions";
import type { LedgerEntry, Redemption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const [{ profile, supabase }, saldo] = await Promise.all([
    getProfile(),
    getBalance(),
  ]);

  const [{ data: ledgerData }, { data: redData }] = await Promise.all([
    supabase
      .from("points_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("redemptions")
      .select("*")
      .eq("estado", "pendente")
      .order("created_at", { ascending: false }),
  ]);
  const ledger = (ledgerData ?? []) as LedgerEntry[];
  const pendentes = (redData ?? []) as Redemption[];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-coffee">
            {profile?.nome ?? "O meu perfil"}
          </h1>
          <p className="text-sm text-coffee-soft">{saldo} pontos</p>
        </div>
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="rounded-full bg-coffee px-3.5 py-2 text-xs font-semibold text-cream-soft"
          >
            Admin
          </Link>
        )}
      </header>

      {pendentes.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-coffee-soft">
            Resgates por levantar
          </h2>
          <ul className="flex flex-col gap-2">
            {pendentes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-2xl bg-leaf/10 p-3.5"
              >
                <span className="text-sm font-medium text-coffee">
                  Mostra este código ao balcão
                </span>
                <span className="font-display text-lg font-bold tracking-widest text-leaf">
                  {p.codigo}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-coffee-soft">
          Histórico de pontos
        </h2>
        {ledger.length === 0 ? (
          <p className="rounded-2xl bg-white/70 p-4 text-sm text-coffee-soft">
            Ainda não tens movimentos. Começa a juntar pontos!
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-coffee/5 rounded-2xl bg-white/70">
            {ledger.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-coffee">
                    {e.reason ?? sourceLabel(e.source)}
                  </p>
                  <p className="text-xs text-coffee-soft">
                    {new Date(e.created_at).toLocaleDateString("pt-PT", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${e.delta >= 0 ? "text-leaf" : "text-brick"}`}
                >
                  {e.delta >= 0 ? "+" : ""}
                  {e.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-2xl border border-coffee/15 bg-white/60 py-3 text-sm font-semibold text-coffee-soft transition active:scale-[0.99]"
        >
          Terminar sessão
        </button>
      </form>
    </div>
  );
}

function sourceLabel(s: LedgerEntry["source"]): string {
  return s === "earn" ? "Pontos ganhos" : s === "redeem" ? "Resgate" : "Ajuste";
}
