"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, Spinner, TrashConfirm, SectionLabel, DashedAddButton } from "@/design/ui";
import { createClient } from "@/lib/supabase/client";
import type { LandingPhoto, LandingPhotos } from "@/design/data";
import { addLandingPhoto, patchLandingPhoto, removeLandingPhoto } from "@/lib/landing-actions";

/** Faz upload de um ficheiro para o bucket 'landing' e devolve o URL público. */
async function uploadFile(file: File): Promise<string | null> {
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  // Caminho único — não dá para usar Date.now()/random no servidor, mas aqui (browser) podemos.
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("landing").upload(path, file, { upsert: false, contentType: file.type });
  if (error) return null;
  const { data: pub } = supabase.storage.from("landing").getPublicUrl(path);
  return `${pub.publicUrl}?t=${Date.now()}`;
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

/** Miniatura clicável que troca a foto (upload → patch). */
function PhotoTile({ photo, w, h, refresh }: { photo: LandingPhoto; w: number; h: number; refresh: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const url = await uploadFile(file);
    if (url) {
      await patchLandingPhoto({ id: photo.id, image_url: url });
      refresh();
    }
    setBusy(false);
  }

  return (
    <>
      <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ position: "relative", width: w, height: h, borderRadius: 14, flexShrink: 0, overflow: "hidden", border: "1px solid var(--c-line)", background: "var(--c-surface2)", cursor: busy ? "default" : "pointer", padding: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: busy ? 0.4 : 1 }} />
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: busy ? "rgba(0,0,0,0.25)" : "transparent" }}>
          {busy ? <Spinner size={16} /> : null}
        </span>
        <span style={{ position: "absolute", bottom: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "var(--c-ink)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <Icon name="camera" size={11} stroke={2.4} />
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
    </>
  );
}

/** Botão de adicionar que pede o ficheiro primeiro e só depois cria a linha. */
function AddPhotoButton({ section, label, refresh }: { section: "espaco" | "comida"; label: string; refresh: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const url = await uploadFile(file);
    if (url) {
      await addLandingPhoto({ section, image_url: url });
      refresh();
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <>
      <DashedAddButton label={busy ? "A carregar…" : label} onClick={() => { if (!busy) fileRef.current?.click(); }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
    </>
  );
}

export function LandingAdmin({ photos, onBack }: { photos: LandingPhotos; onBack: () => void }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <>
      <TopBar title="Página inicial" onBack={onBack} />
      <Scroll>
        <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "0 2px 16px", lineHeight: 1.5 }}>
          As fotos que aparecem na <b style={{ color: "var(--c-ink)" }}>página de entrada</b> (a primeira que os visitantes vêem). Toca numa foto para a trocar.
        </p>

        {/* Ambiente — carrossel */}
        <SectionLabel>Ambiente (carrossel)</SectionLabel>
        <p style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", margin: "7px 2px 11px", lineHeight: 1.5 }}>
          O carrossel de fotos do espaço, no topo. Sem legenda.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {photos.espaco.map((p) => (
            <div key={p.id} style={{ position: "relative" }}>
              <PhotoTile photo={p} w={104} h={76} refresh={refresh} />
              <div style={{ position: "absolute", top: 5, left: 5 }}>
                <TrashConfirm size={26} onConfirm={async () => { await removeLandingPhoto(p.id); refresh(); }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 11 }}>
          <AddPhotoButton section="espaco" label="Adicionar foto de ambiente" refresh={refresh} />
        </div>

        {/* Da nossa casa — comida com legenda */}
        <div style={{ marginTop: 26 }}>
          <SectionLabel>Da nossa casa (comida)</SectionLabel>
        </div>
        <p style={{ fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", margin: "7px 2px 11px", lineHeight: 1.5 }}>
          As fotos de comida com legenda em <b style={{ color: "var(--c-ink)" }}>PT e EN</b>.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {photos.comida.map((p) => (
            <Card key={p.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <PhotoTile photo={p} w={86} h={86} refresh={refresh} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <Lang flag="PT" value={p.label_pt || ""} ph="Nome" onCommit={(v) => { void patchLandingPhoto({ id: p.id, label_pt: v }); }} />
                <Lang flag="EN" value={p.label_en || ""} ph="Name" onCommit={(v) => { void patchLandingPhoto({ id: p.id, label_en: v }); }} />
              </div>
              <TrashConfirm size={30} onConfirm={async () => { await removeLandingPhoto(p.id); refresh(); }} />
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 11 }}>
          <AddPhotoButton section="comida" label="Adicionar foto de comida" refresh={refresh} />
        </div>
      </Scroll>
    </>
  );
}
