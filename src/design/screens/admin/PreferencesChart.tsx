"use client";

import { Card } from "@/design/ui";
import type { FoodPrefStat } from "@/design/data";

const COLORS = ["var(--c-primary)", "var(--c-red)", "var(--c-blue)", "var(--c-green)", "var(--c-ink)"];

export function PreferencesChart({ stats }: { stats: FoodPrefStat[] }) {
  const data = stats.filter((s) => s.count > 0);
  const total = data.reduce((s, x) => s + x.count, 0);

  if (total === 0) {
    return (
      <Card style={{ textAlign: "center", padding: "24px 18px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13 }}>
        Ainda sem respostas de comida preferida.
      </Card>
    );
  }

  // Donut via stroke-dasharray num círculo. r=54, circ ≈ 339.3.
  const r = 54;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = data.map((s, i) => {
    const frac = s.count / total;
    const seg = { color: COLORS[i % COLORS.length], dash: frac * circ, gap: circ - frac * circ, offset: -offset * circ };
    offset += frac;
    return seg;
  });

  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
      <svg width="148" height="148" viewBox="0 0 148 148" style={{ flexShrink: 0 }}>
        <g transform="rotate(-90 74 74)">
          <circle cx="74" cy="74" r={r} fill="none" stroke="var(--c-surface2)" strokeWidth="18" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="74"
              cy="74"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={seg.offset}
            />
          ))}
        </g>
        <text x="74" y="70" textAnchor="middle" style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 24, fill: "var(--c-ink)" }}>{total}</text>
        <text x="74" y="88" textAnchor="middle" style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 10, fill: "var(--c-muted)" }}>clientes</text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140, flex: 1 }}>
        {data.map((s, i) => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <div key={s.slug} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, flexShrink: 0, background: COLORS[i % COLORS.length] }} />
              <span style={{ flex: 1, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
              <span style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-muted)", flexShrink: 0 }}>{s.count} · {pct}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
