"use client";

import { useState } from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { Scroll, Card, IconTile, Button, LogoBadge, Stamp, SectionLabel, TopBar } from "@/design/ui";
import { TIERS, tierIndexFor, type AppData, type RewardRow, type HistoryRow } from "@/design/data";

// ── Barra de progresso de gasto ──────────────────────────────────────────────
export function SpendBar({ spend, euroPerStamp }: { spend: number; euroPerStamp: number }) {
  const { T } = useI18n();
  const pct = Math.max(0, Math.min(100, (spend / euroPerStamp) * 100));
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11.5, marginBottom: 6 }}>
        <span style={{ color: "var(--c-muted)" }}>{T("card.nextStamp") as string}</span>
        <span style={{ color: "var(--c-primary)" }}>
          {spend}€ <span style={{ color: "var(--c-muted)" }}>/ {euroPerStamp}€</span>
        </span>
      </div>
      <div style={{ height: 9, borderRadius: 100, background: "color-mix(in srgb, var(--c-primary) 12%, var(--c-surface2))", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", borderRadius: 100, background: "linear-gradient(90deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 60%, var(--c-red)))", transition: "width .5s cubic-bezier(.4,.8,.3,1)" }} />
      </div>
    </div>
  );
}

// ── Cartão de membro ─────────────────────────────────────────────────────────
export function MemberCard({
  points,
  nome,
  memberSince,
  onQR,
  compact,
}: {
  points: number;
  nome: string;
  memberSince: string;
  onQR: () => void;
  compact?: boolean;
}) {
  const { T, L } = useI18n();
  const [tiers, setTiers] = useState(false);
  const tier = TIERS[tierIndexFor(points)];
  return (
    <>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          padding: 18,
          color: "#fff",
          background: "linear-gradient(135deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 55%, var(--c-red)))",
          boxShadow: "0 16px 30px -14px color-mix(in srgb, var(--c-primary) 70%, transparent)",
        }}
      >
        <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />
        <div style={{ position: "absolute", bottom: -40, left: 30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => setTiers(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 11px 5px 9px",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              fontFamily: "var(--f-body)",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            <Icon name="star" size={15} fill="#fff" color="#fff" /> {(L(tier.name) as string).toUpperCase()}
            <Icon name="chevronRight" size={14} color="rgba(255,255,255,0.85)" />
          </button>
          <LogoBadge size={38} ring={false} />
        </div>
        <div style={{ position: "relative", marginTop: compact ? 10 : 16 }}>
          <div style={{ fontFamily: "var(--f-body)", fontSize: 13, opacity: 0.9 }}>{T("mc.balance") as string}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 44, lineHeight: 1 }}>{points}</span>
            <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 18, opacity: 0.9 }}>pts</span>
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, opacity: 0.92 }}>{nome}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 11.5, opacity: 0.75 }}>{T("mc.since", memberSince) as string}</div>
          </div>
          <button
            onClick={onQR}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 13,
              border: "none",
              background: "rgba(255,255,255,0.95)",
              color: "var(--c-primaryInk)",
              cursor: "pointer",
              fontFamily: "var(--f-display)",
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            <Icon name="qr" size={17} stroke={2.2} /> {T("mc.show") as string}
          </button>
        </div>
      </div>
      {tiers && <TiersSheet points={points} onClose={() => setTiers(false)} />}
    </>
  );
}

export function TiersSheet({ points, onClose }: { points: number; onClose: () => void }) {
  const { T, L } = useI18n();
  const curIdx = tierIndexFor(points);
  const next = TIERS[curIdx + 1];
  const toNext = next ? next.min - points : 0;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end", background: "rgba(20,14,6,0.45)", backdropFilter: "blur(3px)", animation: "fadeIn .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxHeight: "88%", overflowY: "auto", background: "var(--c-surface)", borderRadius: "26px 26px 0 0", padding: "20px 20px 30px", animation: "popIn .25s ease" }}>
        <div style={{ width: 40, height: 4, borderRadius: 100, background: "var(--c-line)", margin: "0 auto 16px" }} />
        <h3 style={{ margin: "0 0 3px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 19, color: "var(--c-ink)", textAlign: "center" }}>{T("tiers.title") as string}</h3>
        <p style={{ margin: "0 0 18px", fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", textAlign: "center", lineHeight: 1.45 }}>
          {next ? (T("tiers.toNext", toNext, L(next.name)) as string) : (T("tiers.sub") as string)}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {TIERS.map((tier, i) => {
            const isCurrent = i === curIdx;
            const ac = `var(--c-${tier.accent})`;
            return (
              <div key={tier.id} style={{ position: "relative", borderRadius: 18, padding: 15, border: isCurrent ? `2px solid ${ac}` : "1px solid var(--c-line)", background: isCurrent ? `color-mix(in srgb, ${ac} 8%, var(--c-surface))` : "var(--c-surface)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <IconTile icon={tier.icon} accent={ac} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 16, color: "var(--c-ink)", lineHeight: 1.15 }}>{L(tier.name)}</span>
                      {isCurrent && <span style={{ flexShrink: 0, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase", color: "#fff", background: ac, padding: "3px 8px", borderRadius: 100 }}>{T("tiers.current") as string}</span>}
                    </div>
                    <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: ac, marginTop: 3 }}>{T("tiers.from", tier.min) as string}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────
export function Home({
  data,
  points,
  go,
  onQR,
  onBell,
}: {
  data: AppData;
  points: number;
  go: (tab: string) => void;
  onQR: () => void;
  onBell: () => void;
}) {
  const { T, lang } = useI18n();
  const toNext = 50 - (points % 50);
  const near = toNext <= 15;
  const news = data.news.map((n) => ({
    t: lang === "en" && n.titulo_en ? n.titulo_en : n.titulo_pt,
    d: lang === "en" && n.desc_en ? n.desc_en : n.desc_pt ?? "",
    a: `var(--c-${n.accent || "primary"})`,
    i: n.icon || "sparkle",
  }));
  const hasEvents = data.unread > 0;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 18px 14px" }}>
        <LogoBadge size={46} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 21, color: "var(--c-ink)", lineHeight: 1.1 }}>{T("home.hello", data.firstName) as string}</div>
        </div>
        <button onClick={onBell} style={{ width: 42, height: 42, borderRadius: 14, border: "1px solid var(--c-line)", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--c-ink)", position: "relative" }}>
          <Icon name="bell" size={20} />
          {hasEvents && <span style={{ position: "absolute", top: 9, right: 10, width: 8, height: 8, borderRadius: "50%", background: "var(--c-red)", border: "1.5px solid var(--c-surface)" }} />}
        </button>
      </div>

      <Scroll>
        <MemberCard points={points} nome={data.nome} memberSince={data.memberSince} onQR={onQR} />

        {/* Progresso carimbos */}
        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15.5, color: "var(--c-ink)" }}>{T("home.stampCard") as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 13, color: "var(--c-primary)" }}>{data.stamps}/{data.stampGoal}</div>
          </div>
          <SpendBar spend={data.spendToward} euroPerStamp={data.euroPerStamp} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 9, marginTop: 12 }}>
            {Array.from({ length: data.stampGoal }).map((_, i) => (
              <Stamp key={i} filled={i < data.stamps} idx={i + 1} />
            ))}
          </div>
          <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", marginTop: 12, textAlign: "center" }}>
            {T("home.toGoPre") as string}
            <b style={{ color: "var(--c-primary)" }}>{data.stampGoal - data.stamps} carimbos</b> para <b style={{ color: "var(--c-primary)" }}>2 raspadinhas</b> ✨
          </div>
        </Card>

        {/* Cartão de prémios */}
        <Card onClick={() => go("rewards")} style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14, background: near ? "color-mix(in srgb, var(--c-green) 9%, var(--c-surface))" : "var(--c-surface)", borderColor: near ? "color-mix(in srgb, var(--c-green) 22%, var(--c-line))" : "var(--c-line)" }}>
          <IconTile icon="gift" accent={near ? "var(--c-green)" : "var(--c-primary)"} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{(near ? T("home.almost") : T("home.prizes")) as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>{(near ? T("home.almostSub", toNext) : T("home.prizesSub")) as string}</div>
          </div>
          <Icon name="chevronRight" size={20} color="var(--c-muted)" />
        </Card>

        {/* Novidades */}
        {news.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <SectionLabel>{T("home.news") as string}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 11 }}>
            {news.map((n) => (
              <Card key={n.t} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <IconTile icon={n.i} accent={n.a} size={46} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{n.t}</div>
                  <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>{n.d}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        )}
      </Scroll>
    </>
  );
}

// ── Cartão (tab Pontos) ──────────────────────────────────────────────────────
export function LoyaltyCard({
  data,
  points,
  history,
  onQR,
  go,
}: {
  data: AppData;
  points: number;
  history: HistoryRow[];
  onQR: () => void;
  go: (tab: string) => void;
}) {
  const { T } = useI18n();
  return (
    <>
      <TopBar title={T("card.title") as string} />
      <Scroll>
        <MemberCard points={points} nome={data.nome} memberSince={data.memberSince} onQR={onQR} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 14 }}>
          <Card pad={15} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 30, color: "var(--c-primary)", lineHeight: 1 }}>{points}</div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-muted)", marginTop: 3 }}>{T("card.pointsCap") as string}</div>
          </Card>
          <Card pad={15} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 30, color: "var(--c-green)", lineHeight: 1 }}>
              {data.stamps}
              <span style={{ fontSize: 18, color: "var(--c-muted)" }}>/{data.stampGoal}</span>
            </div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-muted)", marginTop: 3 }}>{T("card.stampsCap") as string}</div>
          </Card>
        </div>

        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}>{T("card.yourStamps") as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)" }}>{T("card.perStamp", data.euroPerStamp) as string}</div>
          </div>
          <SpendBar spend={data.spendToward} euroPerStamp={data.euroPerStamp} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14 }}>
            {Array.from({ length: data.stampGoal }).map((_, i) => (
              <Stamp key={i} filled={i < data.stamps} idx={i + 1} />
            ))}
          </div>
        </Card>

        {/* Atalho raspadinhas */}
        <Card onClick={() => go("rewards")} style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 13, color: "#7A560E", background: "linear-gradient(135deg, #F8DE7E, #E7B53A 65%, #C78A1E)", border: "none" }}>
          <div style={{ width: 48, height: 48, borderRadius: 15, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.9)" }}>
            <Icon name="gift" size={24} stroke={2.1} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15.5 }}>{(data.pendingScratch > 0 ? T("card.haveScratch", data.pendingScratch) : T("card.yourScratch")) as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, opacity: 0.85 }}>{(data.pendingScratch > 0 ? T("card.openReveal") : T("card.collect10")) as string}</div>
          </div>
          <Icon name="chevronRight" size={20} />
        </Card>

        {/* Histórico */}
        <div style={{ marginTop: 18 }}>
          <SectionLabel>{T("card.history") as string}</SectionLabel>
          <Card style={{ marginTop: 11, padding: 0, overflow: "hidden" }}>
            {history.length === 0 ? (
              <div style={{ padding: "16px", fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", textAlign: "center" }}>—</div>
            ) : (
              history.map((h, i) => {
                const pos = h.pts > 0;
                const col = pos ? "var(--c-green)" : "var(--c-red)";
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderTop: i ? "1px solid var(--c-line)" : "none" }}>
                    <IconTile icon={pos ? "plus" : "gift"} accent={col} size={38} iconSize={18} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 14, color: "var(--c-ink)" }}>{h.label}</div>
                      <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)" }}>{h.date}</div>
                    </div>
                    <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15, color: col }}>{pos ? "+" : ""}{h.pts}</div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </Scroll>
    </>
  );
}

// ── Recompensas (troca de pontos) ────────────────────────────────────────────
export function Rewards({
  points,
  rewards,
  onRedeem,
}: {
  points: number;
  rewards: RewardRow[];
  onRedeem: (r: RewardRow) => void;
}) {
  const { T, L } = useI18n();
  return (
    <>
      <TopBar
        title={T("rew.title") as string}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 13, background: "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))", color: "var(--c-primary)" }}>
            <Icon name="star" size={16} fill="currentColor" />
            <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15 }}>{points}</span>
          </div>
        }
      />
      <Scroll>
        <p style={{ fontFamily: "var(--f-body)", fontSize: 14, color: "var(--c-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>{T("rew.intro") as string}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rewards.map((r) => {
            const can = points >= r.custo_pontos;
            const accent = `var(--c-${r.accent || "primary"})`;
            const nome = L({ pt: r.titulo, en: r.nome_en || r.titulo });
            const desc = L({ pt: r.descricao || "", en: r.desc_en || r.descricao || "" });
            return (
              <Card key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, opacity: can ? 1 : 0.62 }}>
                <IconTile icon={r.icon || "gift"} accent={accent} size={54} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}>{nome}</div>
                  <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>{desc}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 13.5, color: accent }}>
                    <Icon name="star" size={14} fill="currentColor" /> {r.custo_pontos} pts
                  </div>
                </div>
                <Button size="sm" variant={can ? "primary" : "outline"} accent={accent} onClick={() => can && onRedeem(r)} style={{ pointerEvents: can ? "auto" : "none" }}>
                  {(can ? T("rew.swap") : T("rew.need")) as string}
                </Button>
              </Card>
            );
          })}
        </div>
      </Scroll>
    </>
  );
}
