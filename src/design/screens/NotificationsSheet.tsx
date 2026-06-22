"use client";

import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { IconTile } from "@/design/ui";
import type { AppData } from "@/design/data";

type Evt = { icon: string; accent: string; title: string; sub: string };

export function NotificationsSheet({ data, onClose }: { data: AppData; onClose: () => void }) {
  const { lang } = useI18n();

  const events: Evt[] = [];
  // novidades do café (geridas pela Daniela)
  data.news.forEach((n) => {
    events.push({
      icon: n.icon || "sparkle",
      accent: `var(--c-${n.accent || "primary"})`,
      title: lang === "en" && n.titulo_en ? n.titulo_en : n.titulo_pt,
      sub: lang === "en" && n.desc_en ? n.desc_en : n.desc_pt ?? "",
    });
  });
  // reserva confirmada
  if (data.nextReservation && data.nextReservation.estado === "confirmada") {
    const r = data.nextReservation;
    events.unshift({
      icon: "calendar",
      accent: "var(--c-green)",
      title: "Reserva confirmada",
      sub: `${new Date(r.data + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} · ${r.hora.slice(0, 5)} · ${r.n_pessoas} pax`,
    });
  }
  // prémios ganhos (carteira)
  data.wallet.slice(0, 3).forEach((w) => {
    events.unshift({ icon: w.icon || "gift", accent: `var(--c-${w.accent || "primary"})`, title: `Ganhaste: ${w.nome_pt}`, sub: `Código ${w.codigo} · ${w.status === "usado" ? "usado" : "por usar"}` });
  });
  // movimentos de pontos recentes
  data.history.slice(0, 4).forEach((h) => {
    events.unshift({
      icon: h.pts >= 0 ? "plus" : "gift",
      accent: h.pts >= 0 ? "var(--c-green)" : "var(--c-red)",
      title: `${h.pts >= 0 ? "+" : ""}${h.pts} pontos`,
      sub: `${h.label} · ${h.date}`,
    });
  });

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end", background: "rgba(20,14,6,0.45)", backdropFilter: "blur(3px)", animation: "fadeIn .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxHeight: "82%", overflowY: "auto", background: "var(--c-surface)", borderRadius: "26px 26px 0 0", padding: "20px 18px 28px", animation: "popIn .25s ease" }}>
        <div style={{ width: 40, height: 4, borderRadius: 100, background: "var(--c-line)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Icon name="bell" size={20} color="var(--c-primary)" />
          <h3 style={{ margin: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 19, color: "var(--c-ink)" }}>Notificações</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 16, background: "var(--c-surface2)", border: "1px solid var(--c-line)" }}>
              <IconTile icon={e.icon} accent={e.accent} size={40} iconSize={19} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)" }}>{e.title}</div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>{e.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
