"use client";

import { Card } from "@/design/ui";
import type { FoodPrefStat } from "@/design/data";

const COLORS = ["primary", "red", "blue", "green"];

export function PreferencesChart({ stats }: { stats: FoodPrefStat[] }) {
  const total = stats.reduce((s, x) => s + x.count, 0);
  const max = Math.max(1, ...stats.map((x) => x.count));

  if (total === 0) {
    return (
      <Card style={{ textAlign: "center", padding: "24px 18px", color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13 }}>
        Ainda sem respostas de comida preferida.
      </Card>
    );
  }

  return (
    <Card>
      {stats.map((s, i) => {
        const pct = total ? Math.round((s.count / total) * 100) : 0;
        const accent = COLORS[i % COLORS.length];
        return (
          <div key={s.slug} style={{ marginTop: i ? 13 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-ink)", marginBottom: 6 }}>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
              <span style={{ color: "var(--c-muted)", flexShrink: 0 }}>{s.count} · {pct}%</span>
            </div>
            <div style={{ height: 9, borderRadius: 100, background: "var(--c-surface2)", overflow: "hidden" }}>
              <div style={{ width: `${Math.round((s.count / max) * 100)}%`, height: "100%", borderRadius: 100, background: `var(--c-${accent})` }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
