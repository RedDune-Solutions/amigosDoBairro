"use client";

import { useState } from "react";
import { Icon } from "@/design/icons";
import { useI18n } from "@/design/i18n";
import { TopBar, Scroll, Card, Chip, IconTile } from "@/design/ui";
import { MENU, type Bi, type MenuCatRow } from "@/design/data";

type NormItem = { name: Bi; desc: Bi; image: string | null };
type Norm = { label: Bi; accent: string; icon: string; items: NormItem[] };

function fromRows(rows: MenuCatRow[]): Norm[] {
  return rows.map((c) => ({
    label: { pt: c.label_pt, en: c.label_en || c.label_pt },
    accent: c.accent,
    icon: c.icon,
    items: c.items.map((it) => ({
      name: { pt: it.name_pt, en: it.name_en || it.name_pt },
      desc: { pt: it.desc_pt || "", en: it.desc_en || it.desc_pt || "" },
      image: it.image_url,
    })),
  }));
}

function fromStatic(): Norm[] {
  return MENU.map((m) => ({ label: m.cat, accent: m.accent, icon: m.icon, items: m.items.map((it) => ({ ...it, image: null })) }));
}

export function MenuScreen({ menu }: { menu?: MenuCatRow[] }) {
  const { T, L } = useI18n();
  const cats: Norm[] = menu && menu.length ? fromRows(menu) : fromStatic();
  const [catKey, setCatKey] = useState(0);
  const active = cats[Math.min(catKey, cats.length - 1)];
  const note = T("menu.pointNote") as string[];
  return (
    <>
      <TopBar title={T("menu.title") as string} />
      <div style={{ display: "flex", gap: 9, overflowX: "auto", padding: "0 18px 12px", flexShrink: 0 }} className="om-scroll">
        {cats.map((m, i) => (
          <Chip key={i} active={catKey === i} accent={`var(--c-${m.accent})`} onClick={() => setCatKey(i)}>
            {L(m.label)}
          </Chip>
        ))}
      </div>
      <Scroll>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
          <IconTile icon={active.icon} accent={`var(--c-${active.accent})`} size={44} />
          <h2 style={{ margin: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 20, color: "var(--c-ink)" }}>{L(active.label)}</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {active.items.map((it, i) => (
            <Card key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, flexShrink: 0, overflow: "hidden", background: `color-mix(in srgb, var(--c-${active.accent}) 15%, var(--c-surface))`, color: `var(--c-${active.accent})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <Icon name={active.icon} size={28} stroke={1.9} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}>{L(it.name)}</div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>{L(it.desc)}</div>
              </div>
            </Card>
          ))}
        </div>
        <Card style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, background: "color-mix(in srgb, var(--c-primary) 9%, var(--c-surface))", borderColor: "color-mix(in srgb, var(--c-primary) 22%, var(--c-line))" }}>
          <Icon name="star" size={22} color="var(--c-primary)" fill="var(--c-primary)" />
          <span style={{ fontFamily: "var(--f-body)", fontSize: 13.5, color: "var(--c-ink)" }}>
            {note[0]}<b>{note[1]}</b>{note[2]}
          </span>
        </Card>
      </Scroll>
    </>
  );
}
