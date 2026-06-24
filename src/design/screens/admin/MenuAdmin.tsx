"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card } from "@/design/ui";
import type { MenuCatRow } from "@/design/data";
import {
  addMenuCategory, patchMenuCategory, removeMenuCategory,
  addMenuItem, patchMenuItem, removeMenuItem,
} from "@/lib/menu-actions";

const ICONS = ["coffee", "sandwich", "cake", "plate", "star", "heart", "tag", "gift"];
const ACCENTS = ["primary", "green", "blue", "red"];

function TextInput({ value, onCommit, placeholder, bold }: { value: string; onCommit: (v: string) => void; placeholder?: string; bold?: boolean }) {
  const [v, setV] = useState(value);
  return (
    <input
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onCommit(v)}
      style={{ width: "100%", border: "1px solid var(--c-line)", background: "var(--c-surface2)", borderRadius: 10, padding: "8px 11px", fontFamily: "var(--f-body)", fontWeight: bold ? 700 : 600, fontSize: 13.5, color: "var(--c-ink)", outline: "none" }}
    />
  );
}

function Lang({ flag, value, onCommit, ph }: { flag: string; value: string; onCommit: (v: string) => void; ph?: string }) {
  const [v, setV] = useState(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 10, color: "var(--c-muted)", width: 20, flexShrink: 0 }}>{flag}</span>
      <input value={v} placeholder={ph} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onCommit(v)} style={{ flex: 1, minWidth: 0, border: "1px solid var(--c-line)", background: "var(--c-surface2)", borderRadius: 10, padding: "7px 10px", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13, color: "var(--c-ink)", outline: "none" }} />
    </div>
  );
}

export function MenuAdmin({ menu }: { menu: MenuCatRow[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <>
      <TopBar title="Menu" />
      <Scroll>
        <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "0 2px 14px", lineHeight: 1.5 }}>
          O menu que os clientes vêem na app. Edita nomes, descrições e preços em <b style={{ color: "var(--c-ink)" }}>PT e EN</b>. As alterações ficam guardadas automaticamente.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {menu.map((cat) => (
            <Card key={cat.id} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: `var(--c-${cat.accent})`, background: `color-mix(in srgb, var(--c-${cat.accent}) 15%, var(--c-surface))` }}>
                  <Icon name={cat.icon} size={21} stroke={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Lang flag="PT" value={cat.label_pt} onCommit={(v) => { void patchMenuCategory({ id: cat.id, label_pt: v }); }} />
                  <Lang flag="EN" value={cat.label_en || ""} onCommit={(v) => { void patchMenuCategory({ id: cat.id, label_en: v }); }} />
                </div>
                <button onClick={async () => { if (confirm("Apagar esta categoria e os seus itens?")) { await removeMenuCategory(cat.id); refresh(); } }} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="trash" size={15} stroke={2} />
                </button>
              </div>

              {/* Ícone + cor */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {ICONS.map((ic) => {
                    const on = cat.icon === ic;
                    return (
                      <button key={ic} onClick={() => { void patchMenuCategory({ id: cat.id, icon: ic }); refresh(); }} style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: on ? `2px solid var(--c-${cat.accent})` : "1px solid var(--c-line)", background: "var(--c-surface)", color: "var(--c-ink)" }}>
                        <Icon name={ic} size={15} stroke={2} />
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {ACCENTS.map((ac) => {
                    const on = cat.accent === ac;
                    return (
                      <button key={ac} onClick={() => { void patchMenuCategory({ id: cat.id, accent: ac as "primary" | "green" | "blue" | "red" }); refresh(); }} aria-label={ac} style={{ width: 26, height: 26, borderRadius: "50%", cursor: "pointer", background: `var(--c-${ac})`, border: on ? "3px solid var(--c-ink)" : "2px solid var(--c-surface)", boxShadow: on ? "none" : "0 0 0 1px var(--c-line)" }} />
                    );
                  })}
                </div>
              </div>

              {/* Itens */}
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 2 }}>
                {cat.items.map((it) => (
                  <div key={it.id} style={{ padding: 11, borderRadius: 13, border: "1px solid var(--c-line)", background: "var(--c-surface)", display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <Lang flag="PT" value={it.name_pt} ph="Nome" onCommit={(v) => { void patchMenuItem({ id: it.id, name_pt: v }); }} />
                        <Lang flag="EN" value={it.name_en || ""} ph="Name" onCommit={(v) => { void patchMenuItem({ id: it.id, name_en: v }); }} />
                      </div>
                      <button onClick={async () => { await removeMenuItem(it.id); refresh(); }} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="trash" size={14} stroke={2} />
                      </button>
                    </div>
                    <Lang flag="PT" value={it.desc_pt || ""} ph="Descrição" onCommit={(v) => { void patchMenuItem({ id: it.id, desc_pt: v }); }} />
                    <Lang flag="EN" value={it.desc_en || ""} ph="Description" onCommit={(v) => { void patchMenuItem({ id: it.id, desc_en: v }); }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11.5, color: "var(--c-muted)", width: 50 }}>PREÇO €</span>
                      <div style={{ width: 90 }}>
                        <TextInput value={it.price} bold onCommit={(v) => { void patchMenuItem({ id: it.id, price: v }); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={async () => { await addMenuItem(cat.id); refresh(); }} style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "1.5px dashed color-mix(in srgb, var(--c-ink) 22%, var(--c-line))", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-ink)", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Icon name="plus" size={16} stroke={2.4} /> Adicionar item
              </button>
            </Card>
          ))}
        </div>

        <button onClick={async () => { await addMenuCategory(); refresh(); }} style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 15, border: "1.5px dashed color-mix(in srgb, var(--c-ink) 25%, var(--c-line))", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-ink)", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="plus" size={18} stroke={2.4} /> Adicionar categoria
        </button>
      </Scroll>
    </>
  );
}
