"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, IconTile, Button, SectionLabel } from "@/design/ui";
import { EditProfile } from "@/design/screens/Profile";
import { EquipaSection, type MemberRow, type InviteRow } from "@/design/screens/admin/EquipaScreen";
import { AdminLog, type LogRow } from "@/design/AdminPanel";
import { PreferencesChart } from "@/design/screens/admin/PreferencesChart";
import type { AppData, FoodCategory, FoodPrefStat } from "@/design/data";
import { signOut } from "@/lib/auth-actions";
import { addFoodCategory, patchFoodCategory, removeFoodCategory } from "@/lib/menu-actions";

function initials(name: string) {
  const p = (name || "").trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "?") + (p[1]?.[0] || "")).toUpperCase();
}

const roleLabel: Record<string, string> = { admin: "Administração", staff: "Staff" };

function FoodOptionRow({ opt }: { opt: FoodCategory }) {
  const router = useRouter();
  const [pt, setPt] = useState(opt.label_pt);
  const [en, setEn] = useState(opt.label_en || "");
  return (
    <div style={{ padding: 11, borderRadius: 13, border: "1px solid var(--c-line)", background: "var(--c-surface)", display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input value={pt} onChange={(e) => setPt(e.target.value)} onBlur={() => { if (pt !== opt.label_pt) void patchFoodCategory({ id: opt.id, label_pt: pt }); }} placeholder="PT" style={{ flex: 1, minWidth: 0, border: "1px solid var(--c-line)", background: "var(--c-surface2)", borderRadius: 10, padding: "8px 11px", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--c-ink)", outline: "none" }} />
        <input value={en} onChange={(e) => setEn(e.target.value)} onBlur={() => { if (en !== (opt.label_en || "")) void patchFoodCategory({ id: opt.id, label_en: en }); }} placeholder="EN" style={{ flex: 1, minWidth: 0, border: "1px solid var(--c-line)", background: "var(--c-surface2)", borderRadius: 10, padding: "8px 11px", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13, color: "var(--c-ink)", outline: "none" }} />
        <button onClick={async () => { if (confirm("Apagar esta opção?")) { await removeFoodCategory(opt.id); router.refresh(); } }} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", cursor: "pointer", color: "var(--c-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="trash" size={14} stroke={2} />
        </button>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "var(--f-body)", fontSize: 12.5, fontWeight: 600, color: "var(--c-muted)" }}>
        <input type="checkbox" defaultChecked={opt.ativo} onChange={(e) => { void patchFoodCategory({ id: opt.id, ativo: e.target.checked }); }} style={{ width: 16, height: 16, accentColor: "var(--c-primary)", cursor: "pointer" }} />
        Visível no registo
      </label>
    </div>
  );
}

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
  onSaved: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showLog, setShowLog] = useState(false);

  if (editing) {
    return <EditProfile data={me} onBack={() => setEditing(false)} onSaved={onSaved} />;
  }

  return (
    <>
      <TopBar title="Configurações" />
      <Scroll>
        {/* Perfil */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "4px 0 8px" }}>
          {me.avatarUrl ? (
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: "var(--c-surface2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={me.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--c-primary), var(--c-red))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 30 }}>
              {initials(me.nome)}
            </div>
          )}
          <h2 style={{ margin: "11px 0 2px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 21, color: "var(--c-ink)" }}>{me.nome}</h2>
          <span style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12.5, color: "var(--c-primary)" }}>{roleLabel[me.role] ?? "Equipa"}</span>
        </div>

        <Card onClick={() => setEditing(true)} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 13 }}>
          <IconTile icon="edit" accent="var(--c-blue)" size={42} />
          <div style={{ flex: 1, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Editar perfil</div>
          <Icon name="chevronRight" size={20} color="var(--c-muted)" />
        </Card>

        <Card onClick={() => router.push("/app")} style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 13 }}>
          <IconTile icon="coffee" accent="var(--c-primary)" size={42} />
          <div style={{ flex: 1, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Ver app de cliente</div>
          <Icon name="chevronRight" size={20} color="var(--c-muted)" />
        </Card>

        {isAdmin && (
          <>
            {/* Preferências dos clientes */}
            <div style={{ marginTop: 22 }}><SectionLabel>Comida preferida dos clientes</SectionLabel></div>
            <div style={{ marginTop: 11 }}>
              <PreferencesChart stats={prefStats} />
            </div>

            {/* Opções de comida */}
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

            {/* Equipa */}
            <div style={{ marginTop: 24 }}><SectionLabel>Equipa</SectionLabel></div>
            <div style={{ marginTop: 11 }}>
              <EquipaSection members={members} invites={invites} isOwner={isOwner} meId={meId} />
            </div>

            {/* Registo completo de ações */}
            <div style={{ marginTop: 24 }}><SectionLabel>Registo de ações</SectionLabel></div>
            <Card onClick={() => setShowLog((s) => !s)} style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 13 }}>
              <IconTile icon="sliders" accent="var(--c-green)" size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Ver registo completo</div>
                <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>{log.length} ações</div>
              </div>
              <Icon name="chevronRight" size={20} color="var(--c-muted)" style={{ transform: showLog ? "rotate(90deg)" : "none" }} />
            </Card>
            {showLog && (
              <div style={{ marginTop: 12 }}>
                <AdminLog log={log} />
              </div>
            )}
          </>
        )}

        <form action={signOut} style={{ marginTop: 20 }}>
          <Button full variant="soft" accent="var(--c-red)" icon="logout" type="submit">Terminar sessão</Button>
        </form>
        <p style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", marginTop: 14 }}>Os Amigos do Bairro · v1.0</p>
      </Scroll>
    </>
  );
}
