"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { Scroll, Card, IconTile, Button } from "@/design/ui";
import { AdminPrizes, AdminStats, AdminSettings, type PrizeAdmin, type AdminStatsData } from "@/design/AdminPanel";
import { BalcaoScreen } from "@/design/screens/admin/BalcaoScreen";
import { ReservasAdmin, type ReservaAdminRow } from "@/design/screens/admin/ReservasAdmin";
import { EquipaScreen, type MemberRow, type InviteRow } from "@/design/screens/admin/EquipaScreen";
import { signOut } from "@/lib/auth-actions";

type Tab = "inicio" | "balcao" | "premios" | "reservas" | "equipa";

const TABS: { id: Tab; icon: string; label: string; adminOnly: boolean }[] = [
  { id: "inicio", icon: "chart", label: "Início", adminOnly: true },
  { id: "balcao", icon: "qr", label: "Balcão", adminOnly: false },
  { id: "premios", icon: "gift", label: "Prémios", adminOnly: true },
  { id: "reservas", icon: "calendar", label: "Reservas", adminOnly: false },
  { id: "equipa", icon: "users", label: "Equipa", adminOnly: true },
];

export function AdminShell({
  role,
  nome,
  isOwner,
  prizes: initialPrizes,
  stats,
  euroPerStamp,
  stampGoal,
  reservas,
  members,
  invites,
}: {
  role: "staff" | "admin";
  nome: string;
  isOwner: boolean;
  prizes: PrizeAdmin[];
  stats: AdminStatsData;
  euroPerStamp: number;
  stampGoal: number;
  reservas: ReservaAdminRow[];
  members: MemberRow[];
  invites: InviteRow[];
}) {
  const router = useRouter();
  const isAdmin = role === "admin";
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  const [tab, setTab] = useState<Tab>(isAdmin ? "inicio" : "balcao");
  const [prizes, setPrizes] = useState(initialPrizes);

  let screen: React.ReactNode = null;
  if (tab === "inicio") {
    screen = (
      <>
        <div style={{ padding: "8px 18px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="shield" size={18} color="var(--c-primary)" fill="color-mix(in srgb, var(--c-primary) 18%, transparent)" />
            <h1 style={{ margin: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 22, color: "var(--c-ink)" }}>Administração</h1>
          </div>
          <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>Os Amigos do Bairro · {nome}</div>
        </div>
        <Scroll>
          <AdminStats stats={stats} prizes={prizes} />
          <div style={{ marginTop: 20, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--c-muted)" }}>Regras de fidelidade</div>
          <div style={{ marginTop: 11 }}>
            <AdminSettings euroPerStamp={euroPerStamp} stampGoal={stampGoal} />
          </div>
          <Card onClick={() => router.push("/app")} style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 13 }}>
            <IconTile icon="coffee" accent="var(--c-primary)" size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}>Ver app de cliente</div>
              <div style={{ fontFamily: "var(--f-body)", fontSize: 12.5, color: "var(--c-muted)" }}>O teu cartão de membro</div>
            </div>
            <Icon name="chevronRight" size={20} color="var(--c-muted)" />
          </Card>
          <form action={signOut} style={{ marginTop: 14 }}>
            <Button full variant="outline" type="submit" icon="logout">Terminar sessão</Button>
          </form>
        </Scroll>
      </>
    );
  } else if (tab === "balcao") {
    screen = <BalcaoScreen />;
  } else if (tab === "premios") {
    screen = (
      <>
        <div style={{ padding: "8px 18px 10px" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 22, color: "var(--c-ink)" }}>Prémios</h1>
        </div>
        <Scroll>
          <AdminPrizes prizes={prizes} setPrizes={setPrizes} />
        </Scroll>
      </>
    );
  } else if (tab === "reservas") {
    screen = <ReservasAdmin reservas={reservas} />;
  } else if (tab === "equipa") {
    screen = <EquipaScreen members={members} invites={invites} isOwner={isOwner} />;
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{screen}</div>
      <div style={{ flexShrink: 0, display: "flex", padding: "8px 6px 26px", background: "var(--c-surface)", borderTop: "1px solid var(--c-line)" }}>
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ flex: 1, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", color: on ? "var(--c-primary)" : "var(--c-muted)" }}
            >
              <Icon name={t.icon} size={22} stroke={on ? 2.4 : 2} />
              <span style={{ fontFamily: "var(--f-body)", fontSize: 11, fontWeight: on ? 800 : 600 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
