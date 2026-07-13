"use client";

import { useState } from "react";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, FormSubmitButton } from "@/design/ui";
import { atualizarReserva } from "@/lib/admin-actions";

export type ReservaAdminRow = {
  id: string;
  data: string;
  hora: string;
  n_pessoas: number;
  estado: string;
  cliente: string;
};

/** Fluxo: pedido entra em "Novas" → respondido passa a "Próximas" (ainda se
 *  pode mudar aceitar⇄recusar) → quando a data+hora passa cai no "Arquivo",
 *  fechada (read-only). */
export function ReservasAdmin({ reservas, passadas }: { reservas: ReservaAdminRow[]; passadas: ReservaAdminRow[] }) {
  const [tab, setTab] = useState<"novas" | "proximas" | "arquivo">("novas");
  const [filtroProx, setFiltroProx] = useState<"todas" | "confirmada" | "cancelada">("todas");
  const [filtroArq, setFiltroArq] = useState<"todas" | "confirmada" | "cancelada" | "pendente">("todas");
  const [buscaArq, setBuscaArq] = useState("");

  const novas = reservas.filter((r) => r.estado === "pendente");
  const proximas = reservas.filter((r) => r.estado !== "pendente");
  const proximasFiltradas = filtroProx === "todas" ? proximas : proximas.filter((r) => r.estado === filtroProx);

  // Arquivo: primeiro a busca por cliente, depois o filtro por estado (os
  // contadores dos chips refletem a busca ativa).
  const qArq = buscaArq.trim().toLowerCase();
  const arquivoBusca = qArq ? passadas.filter((r) => r.cliente.toLowerCase().includes(qArq)) : passadas;
  const arquivoFiltrado = filtroArq === "todas" ? arquivoBusca : arquivoBusca.filter((r) => r.estado === filtroArq);

  const list = tab === "novas" ? novas : tab === "proximas" ? proximasFiltradas : arquivoFiltrado;

  return (
    <>
      <TopBar title="Reservas" />
      <Scroll>
        <div style={{ display: "flex", gap: 6, padding: 5, borderRadius: 15, background: "var(--c-surface2)", border: "1px solid var(--c-line)", marginBottom: 14 }}>
          {([["novas", "Novas", novas.length], ["proximas", "Próximas", proximas.length], ["arquivo", "Arquivo", passadas.length]] as const).map(([k, lab, n]) => {
            const on = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "10px 8px", borderRadius: 11, cursor: "pointer", border: "none", background: on ? "var(--c-ink)" : "transparent", color: on ? "#fff" : "var(--c-muted)", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {lab}
                <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11, minWidth: 18, padding: "1px 6px", borderRadius: 100, background: on ? "rgba(255,255,255,0.22)" : "var(--c-surface)", color: on ? "#fff" : "var(--c-muted)" }}>{n}</span>
              </button>
            );
          })}
        </div>

        {tab === "proximas" && (
          <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
            <Chip label="Todas" n={proximas.length} on={filtroProx === "todas"} onClick={() => setFiltroProx("todas")} />
            <Chip label="Aceites" n={proximas.filter((r) => r.estado === "confirmada").length} on={filtroProx === "confirmada"} onClick={() => setFiltroProx("confirmada")} />
            <Chip label="Recusadas" n={proximas.filter((r) => r.estado === "cancelada").length} on={filtroProx === "cancelada"} onClick={() => setFiltroProx("cancelada")} />
          </div>
        )}

        {tab === "arquivo" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 14, background: "var(--c-surface)", border: "1px solid var(--c-line)", marginBottom: 12 }}>
              <Icon name="search" size={18} color="var(--c-muted)" stroke={2.2} />
              <input value={buscaArq} onChange={(e) => setBuscaArq(e.target.value)} placeholder="Procurar por cliente…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--c-ink)" }} />
              {buscaArq && (
                <button onClick={() => setBuscaArq("")} aria-label="Limpar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--c-muted)", display: "flex", padding: 2 }}>
                  <Icon name="x" size={16} stroke={2.2} />
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
              <Chip label="Todas" n={arquivoBusca.length} on={filtroArq === "todas"} onClick={() => setFiltroArq("todas")} />
              <Chip label="Aceites" n={arquivoBusca.filter((r) => r.estado === "confirmada").length} on={filtroArq === "confirmada"} onClick={() => setFiltroArq("confirmada")} />
              <Chip label="Recusadas" n={arquivoBusca.filter((r) => r.estado === "cancelada").length} on={filtroArq === "cancelada"} onClick={() => setFiltroArq("cancelada")} />
              <Chip label="Sem resposta" n={arquivoBusca.filter((r) => r.estado === "pendente").length} on={filtroArq === "pendente"} onClick={() => setFiltroArq("pendente")} />
            </div>
          </>
        )}

        {list.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "28px 18px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13.5 }}>
            {tab === "novas"
              ? "Sem pedidos novos."
              : tab === "proximas"
                ? filtroProx === "confirmada"
                  ? "Sem reservas aceites."
                  : filtroProx === "cancelada"
                    ? "Sem reservas recusadas."
                    : "Sem próximas reservas."
                : qArq
                  ? `Sem reservas para “${buscaArq.trim()}”.`
                  : "Sem reservas no arquivo."}
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {list.map((r) => (
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
                      color: r.estado === "confirmada" ? "var(--c-green)" : r.estado === "cancelada" ? "var(--c-red)" : "var(--c-primary)",
                      background:
                        r.estado === "confirmada"
                          ? "color-mix(in srgb, var(--c-green) 14%, var(--c-surface))"
                          : r.estado === "cancelada"
                            ? "color-mix(in srgb, var(--c-red) 12%, var(--c-surface))"
                            : "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))",
                    }}
                  >
                    {r.estado === "confirmada" ? "Aceite" : r.estado === "cancelada" ? "Recusada" : tab === "arquivo" ? "Sem resposta" : "Pedido"}
                  </span>
                </div>
                {/* Arquivo (data já passou) é read-only — a reserva dá-se como
                    fechada; responder agora dispararia push ao cliente sem sentido. */}
                {tab !== "arquivo" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {r.estado !== "confirmada" && (
                      <form action={atualizarReserva} style={{ flex: 1 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="estado" value="confirmada" />
                        <FormSubmitButton style={btn("var(--c-green)")}>Aceitar</FormSubmitButton>
                      </form>
                    )}
                    {r.estado !== "cancelada" && (
                      <form action={atualizarReserva} style={{ flex: 1 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="estado" value="cancelada" />
                        <FormSubmitButton style={btn("var(--c-red)")}>{r.estado === "confirmada" ? "Cancelar" : "Recusar"}</FormSubmitButton>
                      </form>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Scroll>
    </>
  );
}

/** Chip de filtro (pill) — partilhado por Próximas e Arquivo. */
function Chip({ label, n, on, onClick }: { label: string; n: number; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 13px",
        borderRadius: 100,
        cursor: "pointer",
        border: "1px solid " + (on ? "transparent" : "var(--c-line)"),
        background: on ? "color-mix(in srgb, var(--c-primary) 16%, var(--c-surface))" : "var(--c-surface)",
        color: on ? "var(--c-primary)" : "var(--c-muted)",
        fontFamily: "var(--f-body)",
        fontWeight: 800,
        fontSize: 12.5,
      }}
    >
      {label} · {n}
    </button>
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
