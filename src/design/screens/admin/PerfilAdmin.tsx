"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, IconTile, Button } from "@/design/ui";
import { EditProfile } from "@/design/screens/Profile";
import type { AppData } from "@/design/data";
import { signOut } from "@/lib/auth-actions";

function initials(name: string) {
  const p = (name || "").trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "?") + (p[1]?.[0] || "")).toUpperCase();
}

const roleLabel: Record<string, string> = { admin: "Administração", staff: "Staff" };

export function PerfilAdmin({ me, onSaved }: { me: AppData; onSaved: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditProfile data={me} onBack={() => setEditing(false)} onSaved={onSaved} />;
  }

  return (
    <>
      <TopBar title="Perfil" />
      <Scroll>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "4px 0 8px" }}>
          {me.avatarUrl ? (
            <div style={{ width: 86, height: 86, borderRadius: "50%", overflow: "hidden", background: "var(--c-surface2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={me.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <div style={{ width: 86, height: 86, borderRadius: "50%", background: "linear-gradient(135deg, var(--c-primary), var(--c-red))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 32 }}>
              {initials(me.nome)}
            </div>
          )}
          <h2 style={{ margin: "12px 0 2px", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 22, color: "var(--c-ink)" }}>{me.nome}</h2>
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

        <form action={signOut} style={{ marginTop: 16 }}>
          <Button full variant="soft" accent="var(--c-red)" icon="logout" type="submit">Terminar sessão</Button>
        </form>
        <p style={{ textAlign: "center", fontFamily: "var(--f-body)", fontSize: 12, color: "var(--c-muted)", marginTop: 14 }}>Os Amigos do Bairro · v1.0</p>
      </Scroll>
    </>
  );
}
