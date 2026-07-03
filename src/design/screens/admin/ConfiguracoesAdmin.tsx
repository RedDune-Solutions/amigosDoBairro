"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, IconTile, Button, SectionLabel, Select } from "@/design/ui";
import { EditProfile } from "@/design/screens/Profile";
import { SignOutButton } from "@/design/screens/SignOutButton";
import { EquipaSection, type MemberRow, type InviteRow } from "@/design/screens/admin/EquipaScreen";
import { ClientesAdmin } from "@/design/screens/admin/ClientesAdmin";
import { AdminLog, type LogRow } from "@/design/AdminPanel";
import { PreferencesChart } from "@/design/screens/admin/PreferencesChart";
import { LandingAdmin } from "@/design/screens/admin/LandingAdmin";
import type { AppData, FoodCategory, FoodPrefStat, ClienteRow, LandingPhotos } from "@/design/data";
import { addFoodCategory, patchFoodCategory, removeFoodCategory } from "@/lib/menu-actions";
import { enviarCampanha } from "@/lib/push-actions";

function initials(name: string) {
  const p = (name || "").trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "?") + (p[1]?.[0] || "")).toUpperCase();
}

const roleLabel: Record<string, string> = { admin: "Administração", staff: "Staff" };

/** Checkbox custom — certo a branco sobre fundo de cor (contraste). */
function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const [on, setOn] = useState(checked);
  return (
    <button
      type="button"
      onClick={() => { const v = !on; setOn(v); onChange(v); }}
      style={{ display: "flex", alignItems: "center", gap: 9, border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: "var(--f-body)", fontSize: 12.5, fontWeight: 600, color: "var(--c-muted)" }}
    >
      <span style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: on ? "none" : "1.5px solid var(--c-line)", background: on ? "var(--c-primary)" : "var(--c-surface)", color: "#fff" }}>
        {on && <Icon name="check" size={13} stroke={3} color="#fff" />}
      </span>
      {label}
    </button>
  );
}

function FoodOptionRow({ opt }: { opt: FoodCategory }) {
  const router = useRouter();
  const [pt, setPt] = useState(opt.label_pt);
  const [en, setEn] = useState(opt.label_en || "");
  return (
    <div style={{ padding: 11, borderRadius: 13, border: "1px solid var(--c-line)", background: "var(--c-surface)", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input value={pt} onChange={(e) => setPt(e.target.value)} onBlur={() => { if (pt !== opt.label_pt) void patchFoodCategory({ id: opt.id, label_pt: pt }); }} placeholder="PT" style={{ flex: 1, minWidth: 0, border: "1px solid var(--c-line)", background: "var(--c-surface2)", borderRadius: 10, padding: "8px 11px", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--c-ink)", outline: "none" }} />
        <input value={en} onChange={(e) => setEn(e.target.value)} onBlur={() => { if (en !== (opt.label_en || "")) void patchFoodCategory({ id: opt.id, label_en: en }); }} placeholder="EN" style={{ flex: 1, minWidth: 0, border: "1px solid var(--c-line)", background: "var(--c-surface2)", borderRadius: 10, padding: "8px 11px", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13, color: "var(--c-ink)", outline: "none" }} />
        <button onClick={async () => { if (confirm("Apagar esta opção?")) { await removeFoodCategory(opt.id); router.refresh(); } }} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="trash" size={14} stroke={2} />
        </button>
      </div>
      <Check checked={opt.ativo} onChange={(v) => { void patchFoodCategory({ id: opt.id, ativo: v }); }} label="Visível no registo" />
    </div>
  );
}

function CampanhaForm({ foodCategories }: { foodCategories: FoodCategory[] }) {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [segmento, setSegmento] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    if (busy || titulo.trim().length < 2 || corpo.trim().length < 2) return;
    setBusy(true);
    setRes(null);
    const r = await enviarCampanha({ titulo, corpo, segmento });
    setBusy(false);
    if (r.error) {
      setRes({ ok: false, text: r.error });
      return;
    }
    setRes({ ok: true, text: `Enviada a ${r.enviados} de ${r.alvo} dispositivos.` });
    setTitulo("");
    setCorpo("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid var(--c-line)", background: "var(--c-surface)", borderRadius: 12,
    padding: "11px 13px", fontFamily: "var(--f-body)", fontSize: 14.5, color: "var(--c-ink)", outline: "none",
  };

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <div>
        <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12, color: "var(--c-muted)", marginBottom: 5 }}>SEGMENTO</div>
        <Select
          value={segmento}
          onChange={setSegmento}
          title="Segmento"
          options={[
            { value: "", label: "Todos os clientes" },
            ...foodCategories.map((f) => ({ value: f.slug, label: `Gostam de ${f.label_pt}` })),
          ]}
        />
      </div>
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ex.: Pastéis quentinhos! 🥐)" maxLength={80} style={inputStyle} />
      <textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} placeholder="Mensagem (ex.: Hoje há pastéis acabados de fazer até às 12h.)" maxLength={300} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--f-body)" }} />
      {res && <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: res.ok ? "var(--c-green)" : "var(--c-red)" }}>{res.text}</div>}
      <Button full icon="bell" onClick={send} loading={busy} disabled={titulo.trim().length < 2 || corpo.trim().length < 2}>
        Enviar notificação
      </Button>
    </Card>
  );
}

type View = "home" | "perfil" | "equipa" | "comida" | "campanhas" | "landing";

export function ConfiguracoesAdmin({
  me,
  isAdmin,
  isOwner,
  meId,
  members,
  invites,
  log,
  foodCategories,
  prefStats,
  clientes,
  landingPhotos,
  initialView,
  onSaved,
}: {
  me: AppData;
  isAdmin: boolean;
  isOwner: boolean;
  meId: string;
  members: MemberRow[];
  invites: InviteRow[];
  log: LogRow[];
  foodCategories: FoodCategory[];
  prefStats: FoodPrefStat[];
  clientes: ClienteRow[];
  landingPhotos: LandingPhotos;
  initialView?: "home" | "equipa";
  onSaved: () => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView ?? "home");

  if (view === "perfil") {
    return <EditProfile data={me} onBack={() => setView("home")} onSaved={onSaved} />;
  }

  // Sub-página: Equipa & registo de ações
  if (view === "equipa") {
    return (
      <>
        <TopBar title="Equipa & ações" onBack={() => setView("home")} />
        <Scroll>
          <EquipaSection members={members} invites={invites} isOwner={isOwner} meId={meId} />
          <div style={{ marginTop: 24 }}><SectionLabel>Clientes ({clientes.length})</SectionLabel></div>
          <div style={{ marginTop: 11 }}>
            <ClientesAdmin clientes={clientes} foodCategories={foodCategories} />
          </div>
          <div style={{ marginTop: 24 }}><SectionLabel>Registo de ações</SectionLabel></div>
          <div style={{ marginTop: 11 }}>
            <AdminLog log={log} />
          </div>
        </Scroll>
      </>
    );
  }

  // Sub-página: Comida & preferências
  if (view === "comida") {
    return (
      <>
        <TopBar title="Comida & preferências" onBack={() => setView("home")} />
        <Scroll>
          <SectionLabel>Comida preferida dos clientes</SectionLabel>
          <div style={{ marginTop: 11 }}>
            <PreferencesChart stats={prefStats} />
          </div>

          <div style={{ marginTop: 22 }}><SectionLabel>Opções de comida (registo)</SectionLabel></div>
          <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "8px 2px 11px", lineHeight: 1.5 }}>
            As escolhas que o cliente vê ao criar conta. Edita, desativa ou adiciona.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {foodCategories.map((opt) => (
              <FoodOptionRow key={opt.id} opt={opt} />
            ))}
          </div>
          <button onClick={async () => { await addFoodCategory(); router.refresh(); }} style={{ width: "100%", marginTop: 11, padding: "12px 0", borderRadius: 14, border: "1.5px dashed color-mix(in srgb, var(--c-ink) 25%, var(--c-line))", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-ink)", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="plus" size={17} stroke={2.4} /> Adicionar opção
          </button>
        </Scroll>
      </>
    );
  }

  // Sub-página: Página inicial (fotos da landing)
  if (view === "landing") {
    return <LandingAdmin photos={landingPhotos} onBack={() => setView("home")} />;
  }

  // Sub-página: Campanhas push
  if (view === "campanhas") {
    return (
      <>
        <TopBar title="Campanhas push" onBack={() => setView("home")} />
        <Scroll>
          <p style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", margin: "0 2px 14px", lineHeight: 1.5 }}>
            Envia uma notificação para o telemóvel dos clientes que ativaram. Escolhe o segmento pela comida preferida para campanhas mais certeiras.
          </p>
          <CampanhaForm foodCategories={foodCategories} />
          <p style={{ fontFamily: "var(--f-body)", fontSize: 11.5, color: "var(--c-muted)", margin: "12px 2px 0", lineHeight: 1.5 }}>
            Só recebe quem ativou as notificações no perfil. No iPhone é preciso ter a app adicionada ao ecrã principal.
          </p>
        </Scroll>
      </>
    );
  }

  // Home das configurações
  return (
    <>
      <TopBar title="Configurações" />
      <Scroll>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "4px 0 8px" }}>
          {me.avatarUrl ? (
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: "var(--c-surface2)" }}>
              <Image src={me.avatarUrl} alt="" width={80} height={80} sizes="80px" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--c-primary), var(--c-red))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 30 }}>
              {initials(me.nome)}
            </div>
          )}
          <h2 style={{ margin: "11px 0 2px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 21, color: "var(--c-ink)" }}>{me.nome}</h2>
          <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12.5, color: "var(--c-primary)" }}>{roleLabel[me.role] ?? "Equipa"}</span>
        </div>

        <Card onClick={() => setView("perfil")} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 13 }}>
          <IconTile icon="edit" accent="var(--c-blue)" size={42} />
          <div style={{ flex: 1, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Editar perfil</div>
          <Icon name="chevronRight" size={20} color="var(--c-muted)" />
        </Card>

        {isAdmin && (
          <>
            <Card onClick={() => setView("equipa")} style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 13 }}>
              <IconTile icon="users" accent="var(--c-primary)" size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Equipa & ações</div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>Equipa, clientes (suspender/avisar) e registo</div>
              </div>
              <Icon name="chevronRight" size={20} color="var(--c-muted)" />
            </Card>

            <Card onClick={() => setView("comida")} style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 13 }}>
              <IconTile icon="heart" accent="var(--c-red)" size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Comida & preferências</div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>Opções de comida e gráfico de preferências</div>
              </div>
              <Icon name="chevronRight" size={20} color="var(--c-muted)" />
            </Card>

            <Card onClick={() => setView("landing")} style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 13 }}>
              <IconTile icon="camera" accent="var(--c-blue)" size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Página inicial</div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>Fotos do carrossel e da comida na entrada</div>
              </div>
              <Icon name="chevronRight" size={20} color="var(--c-muted)" />
            </Card>

            <Card onClick={() => setView("campanhas")} style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 13 }}>
              <IconTile icon="bell" accent="var(--c-green)" size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Campanhas push</div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>Enviar notificações segmentadas</div>
              </div>
              <Icon name="chevronRight" size={20} color="var(--c-muted)" />
            </Card>
          </>
        )}

        {/* Ver app de cliente — hiperligação simples */}
        <button
          onClick={() => router.push("/app")}
          style={{ display: "flex", alignItems: "center", gap: 7, margin: "16px auto 0", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--c-primary)" }}
        >
          Ver app de cliente <Icon name="chevronRight" size={16} color="var(--c-primary)" />
        </button>

        <div style={{ marginTop: 18 }}>
          <SignOutButton label="Terminar sessão" />
        </div>
        <p style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", marginTop: 14 }}>Os Amigos do Bairro · v1.0</p>
      </Scroll>
    </>
  );
}
