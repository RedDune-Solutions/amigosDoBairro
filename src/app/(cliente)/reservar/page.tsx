import { requireUser } from "@/lib/data";
import { ReservationForm } from "@/components/reservation-form";
import type { Reservation } from "@/lib/types";

export const dynamic = "force-dynamic";

const estadoStyle: Record<Reservation["estado"], string> = {
  pendente: "bg-amber/15 text-amber",
  confirmada: "bg-leaf/15 text-leaf",
  cancelada: "bg-brick/10 text-brick",
};

export default async function ReservarPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", user.id)
    .gte("data", new Date().toISOString().slice(0, 10))
    .order("data", { ascending: true });
  const reservas = (data ?? []) as Reservation[];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-coffee">
        Reservar mesa
      </h1>

      <ReservationForm />

      {reservas.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-coffee-soft">
            As tuas reservas
          </h2>
          <ul className="flex flex-col gap-2.5">
            {reservas.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl bg-white/70 p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-coffee">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("pt-PT", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-sm text-coffee-soft">
                    {r.hora.slice(0, 5)} · {r.n_pessoas}{" "}
                    {r.n_pessoas === 1 ? "pessoa" : "pessoas"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${estadoStyle[r.estado]}`}
                >
                  {r.estado}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
