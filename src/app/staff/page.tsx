import Link from "next/link";
import { requireStaff } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { StaffScanner } from "@/components/staff-scanner";
import { StaffValidate } from "@/components/staff-validate";
import type { Reservation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const profile = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .gte("data", new Date().toISOString().slice(0, 10))
    .order("data", { ascending: true })
    .limit(30);
  const reservas = (data ?? []) as Reservation[];

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-cream-soft via-cream to-cream-deep">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-10 pt-8">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-coffee-soft">Painel de staff</p>
            <h1 className="font-display text-2xl font-semibold text-coffee">
              Balcão
            </h1>
          </div>
          <Link
            href="/app"
            className="rounded-full border border-coffee/15 px-3.5 py-2 text-xs font-semibold text-coffee-soft"
          >
            Voltar à app
          </Link>
        </header>

        <div className="flex flex-col gap-4">
          <StaffScanner />
          <StaffValidate />

          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-2xl bg-coffee px-4 py-3 text-center text-sm font-semibold text-cream-soft"
            >
              Ir para Admin
            </Link>
          )}

          <section className="rounded-2xl bg-white/70 p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg font-semibold text-coffee">
              Próximas reservas
            </h2>
            {reservas.length === 0 ? (
              <p className="text-sm text-coffee-soft">Sem reservas próximas.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-coffee/5">
                {reservas.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-coffee">
                      {new Date(r.data + "T00:00:00").toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {r.hora.slice(0, 5)}
                    </span>
                    <span className="text-sm font-medium text-coffee-soft">
                      {r.n_pessoas} pax · {r.estado}
                    </span>
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
