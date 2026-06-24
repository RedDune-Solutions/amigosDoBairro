"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { Scroll } from "@/design/ui";
import { AdminPrizes, AdminRewards, AdminStats, type PrizeAdmin, type RewardAdmin, type AdminStatsData } from "@/design/AdminPanel";
import { BalcaoScreen } from "@/design/screens/admin/BalcaoScreen";
import { ReservasAdmin, type ReservaAdminRow } from "@/design/screens/admin/ReservasAdmin";
import { EquipaScreen, type MemberRow, type InviteRow } from "@/design/screens/admin/EquipaScreen";
import { PerfilAdmin } from "@/design/screens/admin/PerfilAdmin";
import { NovidadesAdmin } from "@/design/screens/admin/NovidadesAdmin";
import type { AppData, NewsRow } from "@/design/data";

type Tab = "inicio" | "balcao" | "premios" | "reservas" | "equipa" | "perfil";

const TABS: { id: Tab; icon: string; label: string; adminOnly: boolean }[] = [
  { id: "inicio", icon: "chart", label: "Início", adminOnly: true },
  { id: "balcao", icon: "qr", label: "Balcão", adminOnly: false },
  { id: "premios", icon: "gift", label: "Prémios", adminOnly: true },
  { id: "reservas", icon: "calendar", label: "Reservas", adminOnly: false },
  { id: "equipa", icon: "users", label: "Equipa", adminOnly: true },
  { id: "perfil", icon: "user", label: "Perfil", adminOnly: false },
];

export function AdminShell({
  role,
  nome,
  isOwner,
  meId,
  me,
  prizes: initialPrizes,
  rewards: initialRewards,
  stats,
  reservas,
  members,
  invites,
  news,
}: {
  role: "staff" | "admin";
  nome: string;
  isOwner: boolean;
  meId: string;
  me: AppData;
  prizes: PrizeAdmin[];
  rewards: RewardAdmin[];
  stats: AdminStatsData;
  reservas: ReservaAdminRow[];
  members: MemberRow[];
  invites: InviteRow[];
  news: NewsRow[];
}) {
  const router = useRouter();
  const isAdmin = role === "admin";
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  const [tab, setTab] = useState<Tab>(isAdmin ? "inicio" : "balcao");
  const [prizes, setPrizes] = useState(initialPrizes);
  const [rewards, setRewards] = useState(initialRewards);
  const [prizeMode, setPrizeMode] = useState<"raspadinha" | "pontos">("raspadinha");

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
          <NovidadesAdmin news={news} />
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
          <div style={{ display: "flex", gap: 6, padding: 5, borderRadius: 15, background: "var(--c-surface2)", border: "1px solid var(--c-line)", marginBottom: 4 }}>
            {([["raspadinha", "Raspadinha"], ["pontos", "Pontos"]] as const).map(([k, lab]) => {
              const on = prizeMode === k;
              return (
                <button key={k} onClick={() => setPrizeMode(k)} style={{ flex: 1, padding: "10px 8px", borderRadius: 11, cursor: "pointer", border: "none", background: on ? "var(--c-ink)" : "transparent", color: on ? "#fff" : "var(--c-muted)", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14 }}>
                  {lab}
                </button>
              );
            })}
          </div>
          {prizeMode === "raspadinha" ? (
            <AdminPrizes prizes={prizes} setPrizes={setPrizes} />
          ) : (
            <AdminRewards rewards={rewards} setRewards={setRewards} />
          )}
        </Scroll>
      </>
    );
  } else if (tab === "reservas") {
    screen = <ReservasAdmin reservas={reservas} />;
  } else if (tab === "equipa") {
    screen = <EquipaScreen members={members} invites={invites} isOwner={isOwner} meId={meId} />;
  } else if (tab === "perfil") {
    screen = <PerfilAdmin me={me} onSaved={() => router.refresh()} />;
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
