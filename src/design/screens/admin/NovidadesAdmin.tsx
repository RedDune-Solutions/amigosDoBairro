"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { Card, IconTile, Button, SectionLabel } from "@/design/ui";
import type { NewsRow } from "@/design/data";
import { addNews, setNewsActive, removeNews } from "@/lib/news-actions";

const ICONS = ["sparkle", "cake", "plate", "coffee", "gift", "tag", "star", "percent"];
const ACCENTS: ("primary" | "green" | "blue" | "red")[] = ["primary", "green", "blue", "red"];

export function NovidadesAdmin({ news }: { news: NewsRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("sparkle");
  const [accent, setAccent] = useState<"primary" | "green" | "blue" | "red">("primary");
  const [msg, setMsg] = useState<string | null>(null);

  function refresh() {
    start(() => router.refresh());
  }

  async function add() {
    if (titulo.trim().length < 2) return;
    const res = await addNews({ titulo_pt: titulo.trim(), desc_pt: desc.trim(), icon, accent });
    if (res.error) {
      setMsg(res.error);
      return;
    }
    setTitulo("");
    setDesc("");
    setIcon("sparkle");
    setAccent("primary");
    setOpen(false);
    setMsg(null);
    refresh();
  }

  const inputStyle = {
    borderRadius: 12,
    border: "1px solid var(--c-line)",
    background: "var(--c-surface)",
    padding: "11px 13px",
    fontFamily: "var(--f-body)",
    fontSize: 14.5,
    color: "var(--c-ink)",
    outline: "none",
    width: "100%",
  } as const;

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionLabel>Novidades do bairro</SectionLabel>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ border: "none", background: "color-mix(in srgb, var(--c-primary) 12%, var(--c-surface))", color: "var(--c-primary)", borderRadius: 10, padding: "6px 11px", cursor: "pointer", fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}
        >
          <Icon name={open ? "x" : "plus"} size={15} stroke={2.6} /> {open ? "Fechar" : "Adicionar"}
        </button>
      </div>

      {open && (
        <Card style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ex.: Novo bolo de cenoura)" style={inputStyle} />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição (opcional)" style={inputStyle} />
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} style={{ width: 38, height: 38, borderRadius: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: icon === ic ? "2px solid var(--c-primary)" : "1px solid var(--c-line)", background: "var(--c-surface)", color: "var(--c-ink)" }}>
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {ACCENTS.map((a) => (
              <button key={a} onClick={() => setAccent(a)} aria-label={a} style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer", border: accent === a ? "3px solid var(--c-ink)" : "2px solid var(--c-line)", background: `var(--c-${a})` }} />
            ))}
          </div>
          {msg && <p style={{ margin: 0, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: "var(--c-red)" }}>{msg}</p>}
          <Button full icon="check" onClick={add} disabled={pending || titulo.trim().length < 2}>Publicar novidade</Button>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
        {news.length === 0 && (
          <Card style={{ textAlign: "center", padding: 16, color: "var(--c-muted)", fontFamily: "var(--f-body)", fontSize: 13 }}>Sem novidades. Adiciona a primeira ✨</Card>
        )}
        {news.map((n) => (
          <Card key={n.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: n.ativo ? 1 : 0.55 }}>
            <IconTile icon={n.icon || "sparkle"} accent={`var(--c-${n.accent || "primary"})`} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.titulo_pt}</div>
              {n.desc_pt && <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.desc_pt}</div>}
            </div>
            <button
              onClick={async () => { await setNewsActive(n.id, !n.ativo); refresh(); }}
              title={n.ativo ? "Clica para esconder dos clientes" : "Clica para mostrar aos clientes"}
              style={{ border: "1px solid var(--c-line)", background: n.ativo ? "color-mix(in srgb, var(--c-green) 12%, var(--c-surface))" : "var(--c-surface)", color: n.ativo ? "var(--c-green)" : "var(--c-muted)", borderRadius: 9, padding: "6px 9px", cursor: "pointer", flexShrink: 0, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11.5 }}
            >
              {n.ativo ? "Visível" : "Oculta"}
            </button>
            <button
              onClick={async () => { await removeNews(n.id); refresh(); }}
              title="Remover"
              style={{ border: "1px solid color-mix(in srgb, var(--c-red) 30%, var(--c-line))", background: "color-mix(in srgb, var(--c-red) 8%, var(--c-surface))", color: "var(--c-red)", borderRadius: 9, padding: "6px 8px", cursor: "pointer", flexShrink: 0 }}
            >
              <Icon name="trash" size={17} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
