"use client";

import { useState } from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { IconTile } from "@/design/ui";
import type { AppData, NotifRow } from "@/design/data";
import { arquivarNotificacao } from "@/lib/notif-actions";

function timeAgo(iso: string, lang: "pt" | "en"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return lang === "en" ? "now" : "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function NotificationsSheet({ data, onClose }: { data: AppData; onClose: () => void }) {
  const { lang } = useI18n();
  const [items, setItems] = useState<NotifRow[]>(data.notifications);

  async function archive(id: string) {
    setItems((xs) => xs.filter((x) => x.id !== id)); // optimista — instantâneo
    void arquivarNotificacao(id); // fire-and-forget; sync no fecho do sheet
  }

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end", background: "rgba(20,14,6,0.45)", backdropFilter: "blur(3px)", animation: "fadeIn .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxHeight: "82%", overflowY: "auto", background: "var(--c-surface)", borderRadius: "26px 26px 0 0", padding: "20px 18px 28px", animation: "popIn .25s ease" }}>
        <div style={{ width: 40, height: 4, borderRadius: 100, background: "var(--c-line)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Icon name="bell" size={20} color="var(--c-primary)" />
          <h3 style={{ margin: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 19, color: "var(--c-ink)" }}>
            {lang === "en" ? "Notifications" : "Notificações"}
          </h3>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "34px 18px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-muted)", background: "var(--c-surface2)" }}>
              <Icon name="bell" size={28} />
            </div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 13.5, color: "var(--c-muted)" }}>
              {lang === "en" ? "No notifications yet." : "Ainda sem notificações."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((n) => {
              const unread = n.read_at === null;
              const title = lang === "en" && n.title_en ? n.title_en : n.title_pt;
              const body = lang === "en" && n.body_en ? n.body_en : n.body_pt ?? "";
              return (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 16, background: unread ? "color-mix(in srgb, var(--c-primary) 8%, var(--c-surface2))" : "var(--c-surface2)", border: unread ? "1px solid color-mix(in srgb, var(--c-primary) 25%, var(--c-line))" : "1px solid var(--c-line)" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <IconTile icon={n.icon || "sparkle"} accent={`var(--c-${n.accent || "primary"})`} size={40} iconSize={19} />
                    {unread && <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "var(--c-red)", border: "2px solid var(--c-surface)" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--f-display)", fontWeight: unread ? 800 : 600, fontSize: 14.5, color: "var(--c-ink)" }}>{title}</div>
                    {body && <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>{body}</div>}
                    <div style={{ fontFamily: "var(--f-body)", fontSize: 11, color: "var(--c-muted)", marginTop: 1 }}>{timeAgo(n.created_at, lang)}</div>
                  </div>
                  <button onClick={() => archive(n.id)} aria-label={lang === "en" ? "Archive" : "Arquivar"} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="archive" size={16} stroke={2} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
