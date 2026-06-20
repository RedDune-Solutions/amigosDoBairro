"use client";

import { useRef, useState } from "react";
import { Icon } from "@/design/icons";
import { useI18n, LangToggle } from "@/design/i18n";
import { TopBar, Scroll, Card, IconTile, Button, SectionLabel } from "@/design/ui";
import { TiersSheet } from "@/design/screens/AppScreens";
import { TIERS, tierIndexFor, type AppData } from "@/design/data";
import { updateProfile } from "@/lib/app-actions";
import { signOut } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/design/strings";

function initialsFrom(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function Avatar({ url, initials, size }: { url: string | null; initials: string; size: number }) {
  if (url) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "var(--c-surface2)", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, var(--c-primary), var(--c-red))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: Math.round(size * 0.37), flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function Profile({
  data,
  points,
  lang,
  setLang,
  onEdit,
  onAdmin,
}: {
  data: AppData;
  points: number;
  lang: Lang;
  setLang: (l: Lang) => void;
  onEdit: () => void;
  onAdmin: () => void;
}) {
  const { T, L } = useI18n();
  const [tiers, setTiers] = useState(false);
  const tier = TIERS[tierIndexFor(points)];
  const isAdmin = data.role === "admin";
  const rows = [
    { icon: "edit", label: T("prof.r.edit") as string, accent: "var(--c-blue)", onClick: onEdit },
    { icon: "bell", label: T("prof.r.notif") as string, accent: "var(--c-primary)", detail: T("prof.r.notifOn") as string },
    { icon: "card", label: T("prof.r.pay") as string, accent: "var(--c-green)" },
    { icon: "mapPin", label: T("prof.r.addr") as string, accent: "var(--c-red)" },
    { icon: "settings", label: T("prof.r.help") as string, accent: "var(--c-muted)" },
  ];
  return (
    <>
      <TopBar title={T("prof.title") as string} />
      <Scroll>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "4px 0 6px" }}>
          <button onClick={onEdit} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
            <Avatar url={data.avatarUrl} initials={initialsFrom(data.nome)} size={86} />
          </button>
          <h2 style={{ margin: "12px 0 2px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 22, color: "var(--c-ink)" }}>{data.nome}</h2>
          <button onClick={() => setTiers(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 12px", borderRadius: 100, border: "none", cursor: "pointer", background: "color-mix(in srgb, var(--c-primary) 14%, var(--c-surface))", color: "var(--c-primary)", fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12.5 }}>
            <Icon name="star" size={14} fill="currentColor" /> {L(tier.name)}
            <Icon name="chevronRight" size={14} color="currentColor" />
          </button>
        </div>

        <Card style={{ marginTop: 16, display: "flex", padding: "16px 8px" }}>
          {[[points, T("prof.stat.points") as string], [data.stamps, T("prof.stat.stamps") as string], [data.history.filter((h) => h.pts > 0).length, T("prof.stat.visits") as string]].map(([v, l], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderLeft: i ? "1px solid var(--c-line)" : "none" }}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 22, color: "var(--c-ink)" }}>{v}</div>
              <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 12, color: "var(--c-muted)" }}>{l}</div>
            </div>
          ))}
        </Card>

        <Card style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 13, padding: "14px 16px" }}>
          <IconTile icon="sliders" accent="var(--c-blue)" size={38} iconSize={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{T("common.lang") as string}</div>
            <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>Português · English</div>
          </div>
          <LangToggle value={lang} onChange={setLang} flags />
        </Card>

        {isAdmin && (
          <button onClick={onAdmin} style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", gap: 13, padding: 15, borderRadius: 18, cursor: "pointer", textAlign: "left", border: "none", color: "#fff", background: "linear-gradient(135deg, var(--c-ink), color-mix(in srgb, var(--c-ink) 70%, var(--c-primary)))", boxShadow: "0 12px 26px -12px rgba(40,30,10,0.5)" }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.16)" }}>
              <Icon name="shield" size={24} stroke={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 16 }}>{T("prof.admin") as string}</div>
              <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, opacity: 0.8 }}>{T("prof.adminSub") as string}</div>
            </div>
            <Icon name="chevronRight" size={20} />
          </button>
        )}

        <Card style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
          {rows.map((r, i) => (
            <button key={i} onClick={r.onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", border: "none", borderTop: i ? "1px solid var(--c-line)" : "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
              <IconTile icon={r.icon} accent={r.accent} size={38} iconSize={18} />
              <span style={{ flex: 1, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>{r.label}</span>
              {r.detail && <span style={{ fontFamily: "var(--f-body)", fontSize: 13, color: "var(--c-muted)" }}>{r.detail}</span>}
              <Icon name="chevronRight" size={18} color="var(--c-muted)" />
            </button>
          ))}
        </Card>

        <form action={signOut} style={{ marginTop: 16 }}>
          <Button full variant="soft" accent="var(--c-red)" icon="logout" type="submit">{T("prof.logout") as string}</Button>
        </form>
        <p style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", marginTop: 14 }}>Os Amigos do Bairro · v1.0</p>
      </Scroll>
      {tiers && <TiersSheet points={points} onClose={() => setTiers(false)} />}
    </>
  );
}

function EditField({
  icon,
  accent,
  label,
  value,
  onChange,
  placeholder,
  inputType = "text",
  last,
  readOnly,
}: {
  icon: string;
  accent: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  inputType?: string;
  last?: boolean;
  readOnly?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 4px", borderBottom: last ? "none" : "1px solid var(--c-line)", cursor: readOnly ? "default" : "text" }}>
      <IconTile icon={icon} accent={accent} size={40} iconSize={19} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase", color: focus ? accent : "var(--c-muted)", transition: "color .15s" }}>{label}</div>
        <input
          type={inputType}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 15.5, color: readOnly ? "var(--c-muted)" : "var(--c-ink)", padding: "3px 0 0", margin: 0 }}
        />
      </div>
    </label>
  );
}

export function EditProfile({
  data,
  onBack,
  onSaved,
}: {
  data: AppData;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { T } = useI18n();
  const [name, setName] = useState(data.nome);
  const [phone, setPhone] = useState(data.telefone);
  const [avatar, setAvatar] = useState<string | null>(data.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = initialsFrom(name);
  const dirty = name !== data.nome || phone !== data.telefone;
  const valid = name.trim().length > 1;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!upErr) {
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${pub.publicUrl}?t=${Date.now()}`;
      await updateProfile({ nome: name, telefone: phone, avatar_url: url });
      setAvatar(url);
      onSaved();
    }
    setUploading(false);
  }

  async function save() {
    if (!valid || !dirty || busy) return;
    setBusy(true);
    const res = await updateProfile({ nome: name, telefone: phone });
    setBusy(false);
    if (res.error) return;
    onSaved();
    onBack();
  }

  return (
    <>
      <TopBar title={T("edit.title") as string} onBack={onBack} />
      <Scroll>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2px 0 6px" }}>
          <button onClick={() => fileRef.current?.click()} style={{ position: "relative", border: "none", background: "none", padding: 0, cursor: "pointer" }}>
            <Avatar url={avatar} initials={initials} size={92} />
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 34, height: 34, borderRadius: "50%", background: "var(--c-primary)", border: "3px solid var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Icon name="camera" size={16} stroke={2} />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />
          <div style={{ marginTop: 10, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--c-primary)" }}>
            {uploading ? "A enviar…" : (T("edit.photo") as string)}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <SectionLabel>{T("edit.section") as string}</SectionLabel>
        </div>
        <Card style={{ marginTop: 12, padding: "4px 16px" }}>
          <EditField icon="user" accent="var(--c-blue)" label={T("edit.name") as string} value={name} onChange={setName} placeholder={T("edit.namePh") as string} />
          <EditField icon="mail" accent="var(--c-primary)" label={T("edit.email") as string} value={data.email} readOnly />
          <EditField icon="phone" accent="var(--c-green)" label={T("edit.phone") as string} value={phone} onChange={setPhone} placeholder="+351 ..." inputType="tel" last />
        </Card>

        <Card style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 13, background: "color-mix(in srgb, var(--c-primary) 7%, var(--c-surface))", borderColor: "color-mix(in srgb, var(--c-primary) 20%, var(--c-line))" }}>
          <IconTile icon="star" accent="var(--c-primary)" size={40} iconSize={19} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--c-muted)" }}>{T("edit.member") as string}</div>
            <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15.5, color: "var(--c-ink)" }}>{data.memberSince}</div>
          </div>
        </Card>

        <div style={{ marginTop: 20 }}>
          <Button full size="lg" icon="check" onClick={save} style={{ opacity: dirty && valid ? 1 : 0.5, pointerEvents: dirty && valid ? "auto" : "none" }}>{T("edit.save") as string}</Button>
        </div>
      </Scroll>
    </>
  );
}
