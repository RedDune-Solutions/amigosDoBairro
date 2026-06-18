import Link from "next/link";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { AdminRewardForm } from "@/components/admin-reward-form";
import { AdminAdjustForm } from "@/components/admin-adjust-form";
import { alternarRecompensa, apagarRecompensa, atualizarReserva } from "@/lib/admin-actions";
import type { Reward, Reservation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: rData }, { data: resData }] = await Promise.all([
    supabase.from("rewards").select("*").order("custo_pontos", { ascending: true }),
    supabase
      .from("reservations")
      .select("*")
      .gte("data", new Date().toISOString().slice(0, 10))
      .order("data", { ascending: true })
      .limit(40),
  ]);
  const rewards = (rData ?? []) as Reward[];
  const reservas = (resData ?? []) as Reservation[];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-cream-soft via-cream to-cream-deep">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-10 pt-8">
        <header className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-coffee">Admin</h1>
          <Link
            href="/staff"
            className="rounded-full border border-coffee/15 px-3.5 py-2 text-xs font-semibold text-coffee-soft"
          >
            Painel staff
          </Link>
        </header>

        <div className="flex flex-col gap-4">
          <AdminRewardForm />

          {/* Lista de recompensas */}
          <section className="rounded-2xl bg-white/70 p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg font-semibold text-coffee">
              Recompensas
            </h2>
            <ul className="flex flex-col divide-y divide-coffee/5">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-coffee">
                      {r.titulo}
                    </p>
                    <p className="text-xs text-coffee-soft">
                      {r.custo_pontos} pts ·{" "}
                      {r.stock === null ? "∞" : `${r.stock} un.`} ·{" "}
                      {r.ativo ? "ativa" : "inativa"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <form action={alternarRecompensa}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="ativo" value={String(r.ativo)} />
                      <button className="rounded-lg bg-coffee/5 px-2.5 py-1.5 text-xs font-semibold text-coffee-soft">
                        {r.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                    <form action={apagarRecompensa}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-lg bg-brick/10 px-2.5 py-1.5 text-xs font-semibold text-brick">
                        Apagar
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <AdminAdjustForm />

          {/* Reservas */}
          <section className="rounded-2xl bg-white/70 p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg font-semibold text-coffee">
              Reservas
            </h2>
            {reservas.length === 0 ? (
              <p className="text-sm text-coffee-soft">Sem reservas próximas.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-coffee/5">
                {reservas.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-sm font-medium text-coffee">
                        {new Date(r.data + "T00:00:00").toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {r.hora.slice(0, 5)} · {r.n_pessoas} pax
                      </p>
                      <p className="text-xs capitalize text-coffee-soft">{r.estado}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {r.estado !== "confirmada" && (
                        <form action={atualizarReserva}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="estado" value="confirmada" />
                          <button className="rounded-lg bg-leaf/15 px-2.5 py-1.5 text-xs font-semibold text-leaf">
                            Confirmar
                          </button>
                        </form>
                      )}
                      {r.estado !== "cancelada" && (
                        <form action={atualizarReserva}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="estado" value="cancelada" />
                          <button className="rounded-lg bg-brick/10 px-2.5 py-1.5 text-xs font-semibold text-brick">
                            Cancelar
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
