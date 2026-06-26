"use client";

import { useRef, useState } from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { TopBar, Scroll, Card, IconTile, Button, SectionLabel, Spinner } from "@/design/ui";
import type { AppData, ScratchCardRow, ScratchPrize, RewardRow } from "@/design/data";
import { openScratch } from "@/lib/app-actions";

// Especial = dourado (chamativo). Comum = prata/cinza (discreto, bem menos chamativo).
const GOLD = {
  especial: { foil: ["#F8DE7E", "#E7B53A", "#B07D17"], deep: "#7A560E", glow: "rgba(231,181,58,0.55)" },
  comum: { foil: ["#EDEFF2", "#D2D7DF", "#AEB6C2"], deep: "#566070", glow: "rgba(150,160,178,0.42)" },
};

// Ícone distinto por tipo (o comum NÃO pode ser a estrela/sparkle da especial).
const KIND_ICON: Record<"comum" | "especial", string> = { especial: "sparkle", comum: "coffee" };

// ── Canvas de raspar ─────────────────────────────────────────────────────────
function ScratchCanvas({ kind, onReveal }: { kind: "comum" | "especial"; onReveal: () => void }) {
  const { T } = useI18n();
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const fired = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const g = GOLD[kind];

  function init() {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctxRef.current = ctx;
    const w = canvas.width;
    const h = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, g.foil[0]);
    grad.addColorStop(0.5, g.foil[1]);
    grad.addColorStop(1, g.foil[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w, y = Math.random() * h, rr = Math.random() * 2.4 + 0.6;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5 + 0.15})`;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = g.deep;
    ctx.font = "800 19px Baloo 2, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(T("sc.scratchHere") as string, w / 2, h / 2);
    ctx.font = "700 12px Nunito, system-ui, sans-serif";
    ctx.globalAlpha = 0.7;
    ctx.fillText(T("sc.dragReveal") as string, w / 2, h / 2 + 24);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
  }

  const at = (e: React.PointerEvent) => {
    const canvas = ref.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const stroke = (p: { x: number; y: number }) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineWidth = 46;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (last.current) {
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.arc(p.x, p.y, 23, 0, 7);
    ctx.fill();
    last.current = p;
  };
  const measure = () => {
    if (fired.current) return;
    const canvas = ref.current!;
    const ctx = ctxRef.current!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    const step = 16;
    for (let i = 3; i < data.length; i += 4 * step) if (data[i] === 0) clear++;
    const frac = clear / (data.length / (4 * step));
    if (frac > 0.5) {
      fired.current = true;
      onReveal();
    }
  };
  const down = (e: React.PointerEvent) => { e.preventDefault(); drawing.current = true; last.current = null; stroke(at(e)); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; e.preventDefault(); stroke(at(e)); };
  const up = () => { if (!drawing.current) return; drawing.current = false; measure(); };

  return (
    <canvas
      ref={(el) => { ref.current = el; if (el && !ctxRef.current) init(); }}
      width={320}
      height={190}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={up}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 20, touchAction: "none", cursor: "grab" }}
    />
  );
}

function PrizeFace({ prize }: { prize: ScratchPrize }) {
  const { L } = useI18n();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        textAlign: "center",
        padding: 16,
        background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--c-${prize.accent}) 16%, #fff), #fff 72%)`,
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", color: `var(--c-${prize.accent})`, background: `color-mix(in srgb, var(--c-${prize.accent}) 16%, #fff)` }}>
        <Icon name={prize.icon} size={32} stroke={2.1} />
      </div>
      <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 21, color: "var(--c-ink)", lineHeight: 1.1 }}>
        {L({ pt: prize.nome_pt, en: prize.nome_en || prize.nome_pt })}
      </div>
      <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13, color: "var(--c-muted)" }}>
        {L({ pt: prize.desc_pt || "", en: prize.desc_en || prize.desc_pt || "" })}
      </div>
    </div>
  );
}

function NoPrizeFace() {
  const { T } = useI18n();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        textAlign: "center",
        padding: 16,
        background: "radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--c-muted) 12%, #fff), #fff 72%)",
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-muted)", background: "color-mix(in srgb, var(--c-muted) 14%, #fff)" }}>
        <Icon name="coffee" size={32} stroke={2.1} />
      </div>
      <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 21, color: "var(--c-ink)", lineHeight: 1.1 }}>
        {T("sc.noPrize") as string}
      </div>
      <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13, color: "var(--c-muted)" }}>
        {T("sc.noPrizeSub") as string}
      </div>
    </div>
  );
}

// Face neutra por baixo do verniz (antes de revelar) — NÃO mostra o prémio.
function MysteryFace({ kind }: { kind: "comum" | "especial" }) {
  const g = GOLD[kind];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${g.deep} 9%, #fff), #fff 74%)`,
      }}
    >
      <div style={{ width: 66, height: 66, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", color: g.deep, background: `color-mix(in srgb, ${g.deep} 12%, #fff)`, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 30 }}>
        ?
      </div>
    </div>
  );
}

function ScratchReveal({ card, onClose }: { card: ScratchCardRow; onClose: () => void }) {
  const { T } = useI18n();
  // prize: undefined = ainda não sorteado; null = sem prémio; objeto = ganhou.
  const [prize, setPrize] = useState<ScratchPrize | null | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState(false);
  const g = GOLD[card.kind];

  // O SORTEIO só acontece aqui (ao raspar >50%), nunca ao abrir.
  async function handleReveal() {
    if (revealing || revealed) return;
    setRevealing(true);
    const res = await openScratch(card.id);
    if (res.error || !res.prize) {
      setError(true);
      setRevealing(false);
      return;
    }
    const p = res.prize as { none?: boolean };
    setPrize(p.none ? null : (res.prize as unknown as ScratchPrize));
    setRevealed(true);
    setRevealing(false);
  }

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 85, display: "flex", alignItems: "center", justifyContent: "center", padding: 22, background: "rgba(24,16,4,0.6)", backdropFilter: "blur(5px)", animation: "fadeIn .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "var(--c-surface)", borderRadius: 26, padding: 20, animation: "popIn .25s ease", boxShadow: `0 24px 60px -16px ${g.glow}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 100, background: `linear-gradient(135deg, ${g.foil[0]}, ${g.foil[2]})`, color: g.deep, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}>
            <Icon name={KIND_ICON[card.kind]} size={14} stroke={2.4} /> {T("sc.cardLabel") as string} {(card.kind === "especial" ? T("sc.special") : T("sc.common")) as string}
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 11, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="plus" size={18} style={{ transform: "rotate(45deg)" }} />
          </button>
        </div>

        <div style={{ position: "relative", width: 320, maxWidth: "100%", height: 190, margin: "0 auto" }}>
          {revealed ? (prize ? <PrizeFace prize={prize} /> : <NoPrizeFace />) : <MysteryFace kind={card.kind} />}
          {!revealed && !error && <ScratchCanvas kind={card.kind} onReveal={handleReveal} />}
          {revealing && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.55)", borderRadius: 20 }}>
              <Spinner size={26} color={g.deep} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, minHeight: 4 }}>
          {error ? (
            <div style={{ animation: "popIn .3s ease" }}>
              <div style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-red)", fontWeight: 700, marginBottom: 12 }}>{T("sc.openError") as string}</div>
              <Button full size="lg" onClick={onClose} icon="check">{T("common.close") as string}</Button>
            </div>
          ) : revealed ? (
            prize ? (
              <div style={{ animation: "popIn .3s ease" }}>
                <div style={{ textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 18, color: "var(--c-ink)", marginBottom: 3 }}>{T("sc.won") as string}</div>
                <div style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", marginBottom: 14 }}>{T("sc.wonSub") as string}</div>
                <Button full size="lg" onClick={onClose} icon="wallet">{T("sc.saveWallet") as string}</Button>
              </div>
            ) : (
              <div style={{ animation: "popIn .3s ease" }}>
                <div style={{ textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 18, color: "var(--c-ink)", marginBottom: 3 }}>{T("sc.noPrize") as string}</div>
                <div style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", marginBottom: 14 }}>{T("sc.noPrizeSub") as string}</div>
                <Button full size="lg" onClick={onClose} icon="check">{T("common.close") as string}</Button>
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>{(revealing ? T("sc.revealing") : T("sc.hintRaspar")) as string}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingCard({ card, onOpen }: { card: ScratchCardRow; onOpen: () => void }) {
  const { T } = useI18n();
  const g = GOLD[card.kind];
  const esp = card.kind === "especial";
  return (
    <button onClick={onOpen} style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: 16, cursor: "pointer", textAlign: "left", border: "none", color: g.deep, background: `linear-gradient(135deg, ${g.foil[0]}, ${g.foil[1]} 55%, ${g.foil[2]})`, boxShadow: `0 14px 28px -12px ${g.glow}` }}>
      <div style={{ position: "absolute", top: -24, right: -18, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.22)" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12, letterSpacing: 0.6 }}>
        <Icon name={KIND_ICON[card.kind]} size={15} stroke={2.4} /> {(esp ? T("sc.special") : T("sc.common")) as string}
      </div>
      <div style={{ position: "relative", marginTop: 18, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>
        {(esp ? T("pz.bigPrize") : T("pz.houseTreat")) as string}
      </div>
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "8px 13px", borderRadius: 12, background: "rgba(255,255,255,0.9)", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 13.5, color: g.deep }}>
        <Icon name="gift" size={16} stroke={2.2} /> {T("pz.scratch") as string}
      </div>
    </button>
  );
}

export function PrizesScreen({
  data,
  points,
  go,
  onRedeem,
  onPrizeWon,
}: {
  data: AppData;
  points: number;
  go: (tab: string) => void;
  onRedeem: (r: RewardRow) => void;
  onPrizeWon: () => void;
}) {
  const { T, L } = useI18n();
  const [active, setActive] = useState<ScratchCardRow | null>(null);
  const [walletTab, setWalletTab] = useState<"ativos" | "arquivo">("ativos");
  const pending = data.scratchCards;
  const stampsLeft = data.stampGoal - data.stamps;
  const walletAtivos = data.wallet.filter((w) => w.status !== "usado");
  const walletUsados = data.wallet.filter((w) => w.status === "usado");
  const walletList = walletTab === "ativos" ? walletAtivos : walletUsados;

  // Abrir = instantâneo (sem rede). O sorteio só acontece ao raspar (ScratchReveal).
  // Guard: nunca abre 2 ao mesmo tempo.
  function open(card: ScratchCardRow) {
    if (active) return;
    setActive(card);
  }

  return (
    <>
      <TopBar
        title={T("pz.title") as string}
        onBack={() => go("home")}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 13, background: "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))", color: "var(--c-primary)" }}>
            <Icon name="star" size={16} fill="currentColor" />
            <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15 }}>{points}</span>
          </div>
        }
      />
      <Scroll>
        {/* Banner dourado */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: 18, color: "#7A560E", background: "linear-gradient(135deg, #F8DE7E, #E7B53A 60%, #C78A1E)", boxShadow: "0 16px 32px -14px rgba(231,181,58,0.6)" }}>
          <div style={{ position: "absolute", top: -34, right: -16, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.22)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}>
            <Icon name="sparkle" size={15} stroke={2.4} /> {T("pz.yourScratch") as string}
          </div>
          <div style={{ position: "relative", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 26, marginTop: 8, lineHeight: 1.05 }}>
            {(pending.length ? T("pz.havePending", pending.length) : T("pz.noneYet")) as string}
          </div>
          <div style={{ position: "relative", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13, marginTop: 4, opacity: 0.85 }}>
            {(pending.length ? T("pz.eachTen") : T("pz.toNext", stampsLeft)) as string}
          </div>
        </div>

        {/* Pendentes */}
        {pending.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 14 }}>
            {pending.map((c) => (
              <PendingCard key={c.id} card={c} onOpen={() => open(c)} />
            ))}
          </div>
        ) : (
          <Card style={{ marginTop: 14, textAlign: "center", padding: "22px 18px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-primary)", background: "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))" }}>
              <Icon name="gift" size={28} />
            </div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 13.5, color: "var(--c-muted)" }}>{T("pz.keepGoing") as string}</div>
          </Card>
        )}

        {/* Carteira */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <SectionLabel>{T("pz.myWallet") as string}</SectionLabel>
            <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 100, background: "var(--c-surface2)", border: "1px solid var(--c-line)" }}>
              {([["ativos", T("pz.walletActive") as string], ["arquivo", T("pz.walletArchive") as string]] as const).map(([k, lab]) => {
                const on = walletTab === k;
                return (
                  <button key={k} onClick={() => setWalletTab(k)} style={{ padding: "5px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 11.5, background: on ? "var(--c-primary)" : "transparent", color: on ? "#fff" : "var(--c-muted)" }}>
                    {lab}{k === "arquivo" && walletUsados.length > 0 ? ` ${walletUsados.length}` : ""}
                  </button>
                );
              })}
            </div>
          </div>
          {walletList.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 11 }}>
              {walletList.map((w) => {
                const used = w.status === "usado";
                return (
                  <Card key={w.id} style={{ display: "flex", alignItems: "center", gap: 13, opacity: used ? 0.6 : 1 }}>
                    <IconTile icon={w.icon || "gift"} accent={`var(--c-${w.accent || "primary"})`} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{L({ pt: w.nome_pt, en: w.nome_en || w.nome_pt })}</span>
                        {w.kind === "especial" && <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 9.5, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 6, background: "linear-gradient(135deg,#F8DE7E,#C78A1E)", color: "#7A560E" }}>{T("sc.special") as string}</span>}
                      </div>
                      <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>
                        {T("pz.code") as string} <b style={{ color: "var(--c-ink)", letterSpacing: 0.5 }}>{w.codigo}</b>
                      </div>
                    </div>
                    {used ? (
                      <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12, color: "var(--c-muted)" }}>{T("pz.used") as string}</span>
                    ) : (
                      <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11.5, padding: "6px 11px", borderRadius: 10, background: "color-mix(in srgb, var(--c-green) 15%, var(--c-surface))", color: "var(--c-green)" }}>{T("pz.toUse") as string}</span>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card style={{ marginTop: 11, textAlign: "center", padding: 18, color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13.5 }}>
              {(walletTab === "arquivo" ? T("pz.walletNoUsed") : T("pz.walletEmpty")) as string}
            </Card>
          )}
        </div>

        {/* Trocar pontos */}
        <div style={{ marginTop: 20 }}>
          <SectionLabel>{T("pz.swapPoints") as string}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 11 }}>
            {data.rewards.slice(0, 4).map((r) => {
              const can = points >= r.custo_pontos;
              const accent = `var(--c-${r.accent || "primary"})`;
              return (
                <Card key={r.id} style={{ display: "flex", alignItems: "center", gap: 13, opacity: can ? 1 : 0.62 }}>
                  <IconTile icon={r.icon || "gift"} accent={accent} size={46} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{L({ pt: r.titulo, en: r.nome_en || r.titulo })}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 12.5, color: accent }}>
                      <Icon name="star" size={13} fill="currentColor" /> {r.custo_pontos} pts
                    </div>
                  </div>
                  <Button size="sm" variant={can ? "primary" : "outline"} accent={accent} onClick={() => can && onRedeem(r)} style={{ pointerEvents: can ? "auto" : "none" }}>
                    {(can ? T("rew.swap") : T("rew.need")) as string}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </Scroll>

      {active && (
        <ScratchReveal
          card={active}
          onClose={() => { setActive(null); onPrizeWon(); }}
        />
      )}
    </>
  );
}
