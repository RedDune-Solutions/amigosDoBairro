"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { TopBar, Scroll, Card, Button, SectionLabel } from "@/design/ui";
import { inviteStaff, setRole, removeMember, cancelInvite } from "@/lib/team-actions";

export type MemberRow = { id: string; nome: string | null; role: "customer" | "staff" | "admin"; is_owner: boolean };
export type InviteRow = { email: string; role: string };

const roleLabel: Record<string, string> = { admin: "Admin", staff: "Staff", customer: "Cliente" };

export function EquipaScreen({
  members,
  invites,
  isOwner,
  meId,
}: {
  members: MemberRow[];
  invites: InviteRow[];
  isOwner: boolean;
  meId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function refresh() {
    start(() => router.refresh());
  }

  async function add() {
    if (!email.trim()) return;
    const res = await inviteStaff(email.trim());
    if (res.error) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: res.promoted ? "Promovido a staff ✓" : "Convite enviado por email ✓" });
    setEmail("");
    refresh();
  }

  return (
    <>
      <TopBar title="Equipa" />
      <Scroll>
        {/* Convidar */}
        <Card style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 16, color: "var(--c-ink)" }}>Convidar staff</div>
          <p style={{ margin: 0, fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)", lineHeight: 1.5 }}>
            Insere o email. Se já for utilizador, fica staff na hora; senão recebe um convite por email.
          </p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.pt"
            type="email"
            style={{ borderRadius: 12, border: "1px solid var(--c-line)", background: "var(--c-surface)", padding: "11px 14px", fontFamily: "var(--f-body)", fontSize: 15, color: "var(--c-ink)", outline: "none" }}
          />
          {msg && <p style={{ margin: 0, fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13, color: msg.ok ? "var(--c-green)" : "var(--c-red)" }}>{msg.text}</p>}
          <Button full icon="plus" onClick={add} disabled={pending || !email.trim()}>Adicionar à equipa</Button>
        </Card>

        {/* Convites pendentes */}
        {invites.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <SectionLabel>Convites pendentes</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
              {invites.map((iv) => (
                <Card key={iv.email} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Icon name="mail" size={18} color="var(--c-muted)" />
                  <span style={{ flex: 1, fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--c-ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{iv.email}</span>
                  <button
                    onClick={async () => { await cancelInvite(iv.email); refresh(); }}
                    style={{ border: "none", background: "color-mix(in srgb, var(--c-red) 10%, var(--c-surface))", color: "var(--c-red)", borderRadius: 9, padding: "6px 10px", cursor: "pointer", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12 }}
                  >
                    Cancelar
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Membros */}
        <div style={{ marginTop: 18 }}>
          <SectionLabel>Equipa ({members.length})</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
            {members.map((m) => (
              <Card key={m.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "color-mix(in srgb, var(--c-primary) 16%, var(--c-surface))", color: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14 }}>
                    {(m.nome || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14.5, color: "var(--c-ink)" }}>{m.nome || "—"}</div>
                    <div style={{ fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12, color: m.role === "admin" ? "var(--c-primary)" : "var(--c-muted)" }}>
                      {roleLabel[m.role]}{m.is_owner ? " · Principal" : ""}
                    </div>
                  </div>
                </div>
                {!m.is_owner && m.id !== meId && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {m.role !== "admin" && isOwner && (
                      <MiniBtn label="Tornar admin" color="var(--c-primary)" onClick={async () => { await setRole(m.id, "admin"); refresh(); }} />
                    )}
                    {m.role === "admin" && isOwner && (
                      <MiniBtn label="Passar a staff" color="var(--c-ink)" onClick={async () => { await setRole(m.id, "staff"); refresh(); }} />
                    )}
                    <MiniBtn label="Remover da equipa" color="var(--c-red)" onClick={async () => { await removeMember(m.id); refresh(); }} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </Scroll>
    </>
  );
}

function MiniBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ border: `1px solid color-mix(in srgb, ${color} 30%, var(--c-line))`, background: `color-mix(in srgb, ${color} 8%, var(--c-surface))`, color, borderRadius: 10, padding: "7px 12px", cursor: "pointer", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 12.5 }}
    >
      {label}
    </button>
  );
}
