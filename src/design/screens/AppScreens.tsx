"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { Scroll, Card, IconTile, Button, LogoBadge, Stamp, SectionLabel, TopBar, BottomSheet } from "@/design/ui";
import { TIERS, tierIndexFor, type AppData, type HistoryRow, type TopBairroTabs } from "@/design/data";

// ── Regra dos carimbos (V2: compra ≥15€ = 1 carimbo, máx 2/semana) ───────────
function StampRule() {
  const { T } = useI18n();
  return (
    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 12, background: "color-mix(in srgb, var(--c-primary) 8%, var(--c-surface2))" }}>
      <Icon name="sparkle" size={15} color="var(--c-primary)" />
      <span style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-ink)", lineHeight: 1.4 }}>{T("card.stampRule") as string}</span>
    </div>
  );
}

// ── Cartão de membro ─────────────────────────────────────────────────────────
export function MemberCard({
  points,
  earned,
  nome,
  memberSince,
  onQR,
  compact,
}: {
  points: number;
  earned: number;
  nome: string;
  memberSince: string;
  onQR: () => void;
  compact?: boolean;
}) {
  const { T, L } = useI18n();
  const [tiers, setTiers] = useState(false);
  const tier = TIERS[tierIndexFor(earned)];
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
      {tiers && <TiersSheet earned={earned} onClose={() => setTiers(false)} />}
    </>
  );
}

export function TiersSheet({ earned, onClose }: { earned: number; onClose: () => void }) {
  const { T, L } = useI18n();
  const curIdx = tierIndexFor(earned);
  const next = TIERS[curIdx + 1];
  const toNext = next ? next.min - earned : 0;
  return (
    <BottomSheet onClose={onClose} maxHeight="88%">
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
    </BottomSheet>
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
  const { T, L, lang } = useI18n();
  // Sugestão real: aponta sempre à PRÓXIMA recompensa que o saldo ainda não dá
  // para resgatar (data.rewards já vem ordenada asc por custo_pontos). Avança
  // sozinho à medida que ganha pontos. Sem fake de "múltiplos de 50".
  const hasRewards = data.rewards.length > 0;
  const canRedeemAny = hasRewards && points >= data.rewards[0].custo_pontos; // já dá p/ a mais barata
  const nextReward = data.rewards.find((r) => r.custo_pontos > points) ?? null; // próximo alvo (ou null = dá p/ tudo)
  const rewardName = nextReward ? L({ pt: nextReward.titulo, en: nextReward.nome_en || nextReward.titulo }) : "";
  const toNext = nextReward ? nextReward.custo_pontos - points : 0;
  const near = canRedeemAny || (nextReward != null && toNext <= 100);
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
        <MemberCard points={points} earned={data.earned} nome={data.nome} memberSince={data.memberSince} onQR={onQR} />

        {/* Progresso carimbos */}
        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15.5, color: "var(--c-ink)" }}>{T("home.stampCard") as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 13, color: "var(--c-primary)" }}>{data.stamps}/{data.stampGoal}</div>
          </div>
          <StampRule />
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
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{(canRedeemAny ? T("home.canRedeem") : near ? T("home.almost") : T("home.prizes")) as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>{(!hasRewards
              ? T("home.prizesSub")
              : canRedeemAny
                ? (nextReward ? T("home.redeemAndNext", toNext, rewardName) : T("home.allUnlockedSub"))
                : T("home.toReward", toNext, rewardName)) as string}</div>
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

// ── Top 5 do bairro (leaderboard, tabs mês/sempre, tab Pontos) ───────────────
const RANK_GOLD = "linear-gradient(135deg,#F8DE7E,#E7B53A 65%,#C78A1E)";
const RANK_SILVER = "linear-gradient(135deg,#F2F3F5,#CDD2D8 65%,#9FA6B0)";

function RankBadge({ rank }: { rank: number }) {
  const base: CSSProperties = { width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14 };
  if (rank === 1) return <div style={{ ...base, background: RANK_GOLD, color: "#7A560E", boxShadow: "0 4px 10px -3px rgba(199,138,30,.6)" }}>1</div>;
  if (rank === 2) return <div style={{ ...base, background: RANK_SILVER, color: "#565C66", boxShadow: "0 4px 10px -3px rgba(159,166,176,.55)" }}>2</div>;
  if (rank === 3) return <div style={{ ...base, background: "color-mix(in srgb, var(--c-primary) 16%, var(--c-surface))", color: "var(--c-primary)" }}>{rank}</div>;
  return <div style={{ ...base, background: "var(--c-surface2)", color: "var(--c-muted)" }}>{rank}</div>;
}

function TopBairro({ tabs }: { tabs: TopBairroTabs }) {
  const { T, L } = useI18n();
  const [periodo, setPeriodo] = useState<"mes" | "sempre">("mes");
  if (tabs.mes.length === 0 && tabs.sempre.length === 0) return null;
  const rows = tabs[periodo];
  return (
    <div style={{ marginTop: 18, animation: "fadeIn .3s ease" }}>
      <SectionLabel>{T("top.label") as string}</SectionLabel>
      <Card style={{ marginTop: 11, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 12px" }}>
          <IconTile icon="trophy" accent="var(--c-primary)" size={40} iconSize={20} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 16, color: "var(--c-ink)", lineHeight: 1.15 }}>{T("top.title") as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)" }}>{(periodo === "mes" ? T("top.sub") : T("top.subAll")) as string}</div>
          </div>
          <div style={{ flexShrink: 0, display: "flex", gap: 2, padding: 3, borderRadius: 100, background: "var(--c-surface2)" }}>
            {(["mes", "sempre"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={periodo === p}
                onClick={() => setPeriodo(p)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "5px 10px",
                  borderRadius: 100,
                  fontFamily: "var(--f-body)",
                  fontWeight: 800,
                  fontSize: 10.5,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  background: periodo === p ? "var(--c-primary)" : "transparent",
                  color: periodo === p ? "#fff" : "var(--c-muted)",
                  transition: "all .15s",
                }}
              >
                {(p === "mes" ? T("top.tabMonth") : T("top.tabAll")) as string}
              </button>
            ))}
          </div>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: "16px", borderTop: "1px solid var(--c-line)", fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)", textAlign: "center" }}>
            {(periodo === "mes" ? T("top.empty") : T("top.emptyAll")) as string}
          </div>
        )}
        {rows.map((r) => {
          const tier = TIERS[r.tier] ?? TIERS[0];
          const ac = `var(--c-${tier.accent})`;
          return (
            <div key={r.rank} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderTop: "1px solid var(--c-line)", background: r.isMe ? "color-mix(in srgb, var(--c-primary) 8%, var(--c-surface))" : "transparent" }}>
              <RankBadge rank={r.rank} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--f-body)", fontWeight: r.isMe ? 800 : 700, fontSize: 14.5, color: "var(--c-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.firstName}</span>
                  {r.isMe && <span style={{ flexShrink: 0, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff", background: "var(--c-primary)", padding: "2px 8px", borderRadius: 100 }}>{T("top.you") as string}</span>}
                  {r.rank === 1 && <Icon name="sparkle" size={14} color="#C78A1E" />}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 100, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 9.5, letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap", color: ac, background: `color-mix(in srgb, ${ac} 14%, var(--c-surface))` }}>
                    <Icon name={tier.icon} size={10} stroke={2.4} /> {L(tier.name) as string}
                  </span>
                </div>
              </div>
              <span style={{ flexShrink: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 15, color: r.rank === 1 ? "#C78A1E" : r.isMe ? "var(--c-primary)" : "var(--c-ink)" }}>
                {r.points} <span style={{ fontSize: 11.5, fontFamily: "var(--f-body)", fontWeight: 700, color: "var(--c-muted)" }}>pts</span>
              </span>
            </div>
          );
        })}
      </Card>
    </div>
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
        <MemberCard points={points} earned={data.earned} nome={data.nome} memberSince={data.memberSince} onQR={onQR} />

        {data.expiring && (
          <Card style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 11, background: "color-mix(in srgb, var(--c-red) 9%, var(--c-surface))", borderColor: "color-mix(in srgb, var(--c-red) 25%, var(--c-line))" }}>
            <Icon name="clock" size={20} color="var(--c-red)" />
            <span style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-ink)", lineHeight: 1.4 }}>
              {T("card.expiring", data.expiring.pts, data.expiring.dias) as string}
            </span>
          </Card>
        )}

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

        {/* Top 5 do bairro (leaderboard de pontos, tabs mês/sempre) */}
        <TopBairro tabs={data.topBairro} />

        <Card style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}>{T("card.yourStamps") as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)" }}>{T("card.perStamp") as string}</div>
          </div>
          <StampRule />
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

