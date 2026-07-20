"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, Spinner, TrashConfirm, DashedAddButton } from "@/design/ui";
import { createClient } from "@/lib/supabase/client";
import { storagePathFromPublicUrl } from "@/lib/storage-path";
import type { MenuCatRow, MenuItemRow } from "@/design/data";
import {
  addMenuCategory, patchMenuCategory, removeMenuCategory,
  addMenuItem, patchMenuItem, removeMenuItem,
} from "@/lib/menu-actions";

function ItemPhoto({ item }: { item: MenuItemRow }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${item.id}.${ext}`;
    const { error } = await supabase.storage.from("menu").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "31536000" });
    if (!error) {
      const { data: pub } = supabase.storage.from("menu").getPublicUrl(path);
      await patchMenuItem({ id: item.id, image_url: `${pub.publicUrl}?t=${Date.now()}` });
      // Se a extensão mudou (ex.: .jpg → .png), o upsert não cobre o ficheiro
      // antigo — apagar para não ficar órfão no bucket.
      const oldPath = item.image_url ? storagePathFromPublicUrl(item.image_url, "menu") : null;
      if (oldPath && oldPath !== path) void supabase.storage.from("menu").remove([oldPath]);
      router.refresh();
    }
    setBusy(false);
  }
  async function remove() {
    const res = await patchMenuItem({ id: item.id, image_url: null });
    // Limpeza best-effort do ficheiro no storage (o URL já saiu da BD).
    if (!res.error && item.image_url) {
      const path = storagePathFromPublicUrl(item.image_url, "menu");
      if (path) void createClient().storage.from("menu").remove([path]);
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: "hidden", border: "1px solid var(--c-line)", background: "var(--c-surface2)", cursor: busy ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-muted)", padding: 0 }}>
        {item.image_url ? (
          <Image src={item.image_url} alt="" width={52} height={52} sizes="52px" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <Icon name="camera" size={20} stroke={2} />
        )}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-primary)" }}>
          {busy ? <Spinner size={12} /> : item.image_url ? "Trocar foto" : "Adicionar foto"}
        </button>
        {item.image_url && (
          <button onClick={remove} style={{ marginLeft: 12, border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5, color: "var(--c-red)" }}>Remover</button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
    </div>
  );
}

const ICONS = ["coffee", "sandwich", "cake", "plate", "star", "heart", "tag", "gift"];
const ACCENTS = ["primary", "green", "blue", "red"];

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
          O menu que os clientes vêem na app. Edita nomes e descrições em <b style={{ color: "var(--c-ink)" }}>PT e EN</b>. As alterações ficam guardadas automaticamente.
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
                <TrashConfirm size={32} onConfirm={async () => { await removeMenuCategory(cat.id); refresh(); }} />
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
                      <TrashConfirm size={30} onConfirm={async () => { await removeMenuItem(it.id); refresh(); }} />
                    </div>
                    <Lang flag="PT" value={it.desc_pt || ""} ph="Descrição" onCommit={(v) => { void patchMenuItem({ id: it.id, desc_pt: v }); }} />
                    <Lang flag="EN" value={it.desc_en || ""} ph="Description" onCommit={(v) => { void patchMenuItem({ id: it.id, desc_en: v }); }} />
                    <ItemPhoto item={it} />
                  </div>
                ))}
              </div>

              <DashedAddButton label="Adicionar item" onClick={async () => { await addMenuItem(cat.id); refresh(); }} style={{ padding: "10px 0", borderRadius: 12, fontSize: 13.5 }} />
            </Card>
          ))}
        </div>

        <DashedAddButton label="Adicionar categoria" onClick={async () => { await addMenuCategory(); refresh(); }} style={{ marginTop: 14 }} />
      </Scroll>
    </>
  );
}
