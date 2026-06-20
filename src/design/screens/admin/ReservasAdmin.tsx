"use client";

import { TopBar, Scroll, Card } from "@/design/ui";
import { atualizarReserva } from "@/lib/admin-actions";

export type ReservaAdminRow = {
  id: string;
  data: string;
  hora: string;
  n_pessoas: number;
  estado: string;
  cliente: string;
};

export function ReservasAdmin({ reservas }: { reservas: ReservaAdminRow[] }) {
  return (
    <>
      <TopBar title="Reservas" />
      <Scroll>
        {reservas.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "28px 18px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13.5 }}>
            Sem reservas próximas.
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {reservas.map((r) => (
              <Card key={r.id} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15.5, color: "var(--c-ink)" }}>
                      {new Date(r.data + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })} · {r.hora.slice(0, 5)}
                    </div>
                    <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>
                      {r.cliente} · {r.n_pessoas} pax
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--f-body)",
                      fontWeight: 800,
                      fontSize: 11,
                      padding: "5px 10px",
                      borderRadius: 100,
                      textTransform: "capitalize",
                      color: r.estado === "confirmada" ? "var(--c-green)" : r.estado === "cancelada" ? "var(--c-red)" : "var(--c-primary)",
                      background:
                        r.estado === "confirmada"
                          ? "color-mix(in srgb, var(--c-green) 14%, var(--c-surface))"
                          : r.estado === "cancelada"
                            ? "color-mix(in srgb, var(--c-red) 12%, var(--c-surface))"
                            : "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))",
                    }}
                  >
                    {r.estado}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {r.estado !== "confirmada" && (
                    <form action={atualizarReserva} style={{ flex: 1 }}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="estado" value="confirmada" />
                      <button style={btn("var(--c-green)")}>Confirmar</button>
                    </form>
                  )}
                  {r.estado !== "cancelada" && (
                    <form action={atualizarReserva} style={{ flex: 1 }}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="estado" value="cancelada" />
                      <button style={btn("var(--c-red)")}>Cancelar</button>
                    </form>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Scroll>
    </>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    width: "100%",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    padding: "10px 0",
    fontFamily: "var(--f-display)",
    fontWeight: 700,
    fontSize: 13.5,
    color: "#fff",
    background: color,
  };
}
