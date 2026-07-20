"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { Card, Button, BottomSheet } from "@/design/ui";
import { TIERS, tierIndexFor } from "@/design/data";
import type { ClienteRow, FoodCategory } from "@/design/data";
import { enviarAviso, definirSuspensao, definirReservasBloqueadas, darOferta } from "@/lib/clientes-actions";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
function membro(iso: string): string {
  const d = new Date(iso);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function ClienteCard({ c, foodLabel }: { c: ClienteRow; foodLabel: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avisoOpen, setAvisoOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [ofertaOpen, setOfertaOpen] = useState(false);
  const [nCarimbos, setNCarimbos] = useState(0);
  const [nComum, setNComum] = useState(0);
  const [nEspecial, setNEspecial] = useState(0);
  const totalOferta = nCarimbos + nComum + nEspecial;

  // Escalão = pontos GANHOS (lifetime), igual à app do cliente. Saldo = gastável.
  const tier = TIERS[tierIndexFor(c.ganhos)];
  const tierColor = `var(--c-${tier.accent})`;

  async function send() {
    if (busy || titulo.trim().length < 2) return;
    setBusy(true);
    setMsg(null);
    const r = await enviarAviso({ userId: c.id, titulo, corpo });
    setBusy(false);
    if (r.error) { setMsg({ ok: false, text: r.error }); return; }
    setMsg({ ok: true, text: "Aviso enviado ✓" });
    setTitulo("");
    setCorpo("");
    setAvisoOpen(false);
  }

  async function toggleBan() {
    if (busy) return;
    setBusy(true);
    const r = await definirSuspensao({ userId: c.id, banned: !c.banned });
    setBusy(false);
    setConfirming(false);
    if (r.error) { setMsg({ ok: false, text: r.error }); return; }
    // Recolher o card — os dados mudam com o refresh do servidor.
    setAvisoOpen(false);
    setOpen(false);
    router.refresh();
  }

  function resetOferta() {
    setNCarimbos(0);
    setNComum(0);
    setNEspecial(0);
  }

  async function giveOferta() {
    if (busy || totalOferta === 0) return;
    setBusy(true);
    setMsg(null);
    const r = await darOferta({ userId: c.id, carimbos: nCarimbos, comum: nComum, especial: nEspecial });
    setBusy(false);
    if (r.error) { setMsg({ ok: false, text: r.error }); return; }
    const raspadinhas = nComum + nEspecial + (r.cartolas ?? 0) * 2;
    const partes = [
      nCarimbos > 0 ? `${nCarimbos} carimbo${nCarimbos > 1 ? "s" : ""}` : null,
      raspadinhas > 0 ? `${raspadinhas} raspadinha${raspadinhas > 1 ? "s" : ""}` : null,
    ].filter(Boolean);
    setMsg({ ok: true, text: `Oferta enviada: +${partes.join(" · ")} ✓` });
    setOfertaOpen(false);
    resetOferta();
    router.refresh();
  }

  async function toggleResBlock() {
    if (busy) return;
    setBusy(true);
    const r = await definirReservasBloqueadas({ userId: c.id, bloq: !c.reservas_bloqueadas });
    setBusy(false);
    if (r.error) { setMsg({ ok: false, text: r.error }); return; }
    setOpen(false);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid var(--c-line)", background: "var(--c-surface)", borderRadius: 11,
    padding: "10px 12px", fontFamily: "var(--f-body)", fontSize: 14, color: "var(--c-ink)", outline: "none",
  };
  // Ícone + texto na mesma linha (senão o SVG display:block cai p/ linha própria).
  const detailItem: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5 };

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: open ? 12 : 0 }} pad={14}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 11, border: "none", background: "transparent", cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: c.banned ? "color-mix(in srgb, var(--c-red) 16%, var(--c-surface))" : "color-mix(in srgb, var(--c-primary) 16%, var(--c-surface))", color: c.banned ? "var(--c-red)" : "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15 }}>
          {(c.nome || "?").slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome || "—"}</div>
          <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>{c.telefone || "Sem telefone"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 100, background: `color-mix(in srgb, ${tierColor} 14%, var(--c-surface))`, color: tierColor, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11, lineHeight: 1.3 }}>
              <Icon name="star" size={11} fill="currentColor" /> {tier.name.pt}
            </span>
            <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12, color: "var(--c-ink)" }}>{c.saldo.toLocaleString("pt-PT")} pts</span>
          </div>
        </div>
        {c.banned && (
          <span style={{ flexShrink: 0, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 10.5, padding: "4px 9px", borderRadius: 100, color: "var(--c-red)", background: "color-mix(in srgb, var(--c-red) 13%, var(--c-surface))" }}>Suspenso</span>
        )}
        <Icon name="chevronRight" size={18} color="var(--c-muted)" style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 11, borderTop: "1px solid var(--c-line)", paddingTop: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>
            <span style={detailItem}><Icon name="calendar" size={13} /> Membro desde <b style={{ color: "var(--c-ink)" }}>{membro(c.created_at)}</b></span>
            <span style={detailItem}><Icon name="trophy" size={13} /> <b style={{ color: "var(--c-ink)" }}>{c.ganhos.toLocaleString("pt-PT")} pts</b> ganhos ao todo</span>
            {foodLabel && <span style={detailItem}><Icon name="heart" size={13} /> Gosta de <b style={{ color: "var(--c-ink)" }}>{foodLabel}</b></span>}
            {c.reservas_bloqueadas && <span style={{ ...detailItem, fontWeight: 800, color: "var(--c-red)" }}>Reservas bloqueadas</span>}
          </div>

          {avisoOpen ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do aviso" maxLength={80} style={inputStyle} />
              <textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} placeholder="Mensagem (opcional)" maxLength={300} rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--f-body)" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <Button icon="bell" onClick={send} loading={busy} disabled={titulo.trim().length < 2} style={{ flex: 1 }}>Enviar</Button>
                <Button variant="outline" onClick={() => { setAvisoOpen(false); setMsg(null); }}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <MiniBtn label="Enviar aviso" icon="bell" color="var(--c-primary)" onClick={() => { setAvisoOpen(true); setMsg(null); }} />
              <MiniBtn label="Dar carimbos" icon="ticket" color="var(--c-primary)" onClick={() => { setOfertaOpen(true); resetOferta(); setMsg(null); }} />
              {c.banned ? (
                <MiniBtn label="Reativar conta" icon="check" color="var(--c-green)" onClick={toggleBan} />
              ) : confirming ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={toggleBan} disabled={busy} style={{ border: "none", background: "var(--c-red)", color: "#fff", borderRadius: 10, padding: "8px 12px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12.5 }}>Suspender</button>
                  <button onClick={() => setConfirming(false)} style={{ border: "1px solid var(--c-line)", background: "var(--c-surface)", color: "var(--c-muted)", borderRadius: 10, padding: "8px 11px", cursor: "pointer", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12.5 }}>Não</button>
                </span>
              ) : (
                <MiniBtn label="Suspender" icon="lock" color="var(--c-red)" onClick={() => setConfirming(true)} />
              )}
              <MiniBtn label={c.reservas_bloqueadas ? "Permitir reservas" : "Bloquear reservas"} icon="calendar" color={c.reservas_bloqueadas ? "var(--c-green)" : "var(--c-red)"} onClick={toggleResBlock} />
            </div>
          )}
          {msg && <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: msg.ok ? "var(--c-green)" : "var(--c-red)" }}>{msg.text}</div>}
        </div>
      )}

      {ofertaOpen && (
        <BottomSheet onClose={() => { setOfertaOpen(false); resetOferta(); }} maxHeight="80%">
          <h3 style={{ margin: "0 0 3px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 18, color: "var(--c-ink)", textAlign: "center" }}>
            Dar carimbos a {(c.nome || "cliente").split(" ")[0]}
          </h3>
          <p style={{ margin: "0 0 14px", fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", textAlign: "center", lineHeight: 1.45 }}>
            Escolhe as quantidades. Não conta para o limite de 2 carimbos/semana.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <StepRow icon="ticket" label="Carimbos" hint="no cartão · 10 = 2 raspadinhas" value={nCarimbos} onChange={setNCarimbos} />
            <StepRow icon="dice" label="Raspadinha comum" hint="prémios regulares" value={nComum} onChange={setNComum} />
            <StepRow icon="sparkle" label="Raspadinha especial" hint="grandes prémios" value={nEspecial} onChange={setNEspecial} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Button icon="gift" onClick={giveOferta} loading={busy} disabled={totalOferta === 0} style={{ flex: 1 }}>
              {totalOferta === 0 ? "Escolhe quantidades" : "Dar oferta"}
            </Button>
            <Button variant="outline" onClick={() => { setOfertaOpen(false); resetOferta(); }}>Cancelar</Button>
          </div>
        </BottomSheet>
      )}
    </Card>
  );
}

function StepRow({ icon, label, hint, value, onChange }: { icon: string; label: string; hint: string; value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 13, background: "var(--c-surface)", border: "1px solid var(--c-line)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "color-mix(in srgb, var(--c-primary) 12%, var(--c-surface))", color: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={17} stroke={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 13.5, color: "var(--c-ink)" }}>{label}</div>
        <div style={{ fontFamily: "var(--f-body)", fontSize: 11.5, color: "var(--c-muted)" }}>{hint}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <StepBtn icon="minus" disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))} />
        <span style={{ minWidth: 26, textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 16, color: value > 0 ? "var(--c-ink)" : "var(--c-muted)" }}>{value}</span>
        <StepBtn icon="plus" disabled={value >= 10} onClick={() => onChange(Math.min(10, value + 1))} />
      </div>
    </div>
  );
}

function StepBtn({ icon, onClick, disabled }: { icon: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={icon === "plus" ? "Mais um" : "Menos um"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", color: disabled ? "var(--c-line)" : "var(--c-primary)", cursor: disabled ? "default" : "pointer" }}>
      <Icon name={icon} size={16} stroke={2.4} />
    </button>
  );
}

function MiniBtn({ label, icon, color, onClick }: { label: string; icon: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid color-mix(in srgb, ${color} 30%, var(--c-line))`, background: `color-mix(in srgb, ${color} 8%, var(--c-surface))`, color, borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5 }}>
      <Icon name={icon} size={14} stroke={2.2} /> {label}
    </button>
  );
}

export function ClientesAdmin({ clientes, foodCategories }: { clientes: ClienteRow[]; foodCategories: FoodCategory[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? clientes.filter((c) => (c.nome || "").toLowerCase().includes(query) || (c.telefone || "").toLowerCase().includes(query))
    : clientes;
  const labelOf = (slug: string | null): string | null => {
    if (!slug) return null;
    return foodCategories.find((f) => f.slug === slug)?.label_pt ?? slug;
  };

  return (
    <>
      <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "0 2px 11px", lineHeight: 1.5 }}>
        Todas as contas de cliente. Toca para ver detalhes, enviar um aviso ou suspender.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 14, background: "var(--c-surface)", border: "1px solid var(--c-line)", marginBottom: 12 }}>
        <Icon name="search" size={18} color="var(--c-muted)" stroke={2.2} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar por nome ou telefone…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--c-ink)" }} />
      </div>
      {!filtered.length ? (
        <Card style={{ textAlign: "center", padding: "26px 18px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13 }}>
          {clientes.length ? `Sem clientes para “${q}”.` : "Ainda sem clientes registados."}
        </Card>
      ) : (
        // lista com scroll próprio (não empurra os logs)
        <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 360, overflowY: "auto", overflowX: "hidden", paddingRight: 2, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
          {filtered.map((c) => (
            <ClienteCard key={c.id} c={c} foodLabel={labelOf(c.food_pref)} />
          ))}
        </div>
      )}
    </>
  );
}
