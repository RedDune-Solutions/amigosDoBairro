"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/design/icons";
import { Scroll } from "@/design/ui";
import { AdminPrizes, AdminRewards, AdminStats, AdminLog, type PrizeAdmin, type RewardAdmin, type AdminStatsData, type LogRow } from "@/design/AdminPanel";
import { BalcaoScreen } from "@/design/screens/admin/BalcaoScreen";
import { ReservasAdmin, type ReservaAdminRow } from "@/design/screens/admin/ReservasAdmin";
import { type MemberRow, type InviteRow } from "@/design/screens/admin/EquipaScreen";
import { MenuAdmin } from "@/design/screens/admin/MenuAdmin";
import { ConfiguracoesAdmin } from "@/design/screens/admin/ConfiguracoesAdmin";
import { NovidadesAdmin } from "@/design/screens/admin/NovidadesAdmin";
import type { AppData, NewsRow, MenuCatRow, FoodCategory, FoodPrefStat, ClienteRow, LandingPhotos } from "@/design/data";

type Tab = "inicio" | "balcao" | "premios" | "reservas" | "menu" | "config";

const TABS: { id: Tab; icon: string; label: string; adminOnly: boolean }[] = [
  { id: "inicio", icon: "chart", label: "Início", adminOnly: true },
  { id: "balcao", icon: "qr", label: "Balcão", adminOnly: false },
  { id: "premios", icon: "gift", label: "Prémios", adminOnly: true },
  { id: "reservas", icon: "calendar", label: "Reservas", adminOnly: false },
  { id: "menu", icon: "coffee", label: "Menu", adminOnly: true },
  { id: "config", icon: "settings", label: "Configurações", adminOnly: false },
];

/** Início mostra só as ações de hoje. */
function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

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
  reservasPassadas,
  members,
  invites,
  news,
  log,
  menu,
  foodCategories,
  prefStats,
  clientes,
  landingPhotos,
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
  reservasPassadas: ReservaAdminRow[];
  members: MemberRow[];
  invites: InviteRow[];
  news: NewsRow[];
  log: LogRow[];
  menu: MenuCatRow[];
  foodCategories: FoodCategory[];
  prefStats: FoodPrefStat[];
  clientes: ClienteRow[];
  landingPhotos: LandingPhotos;
}) {
  const router = useRouter();
  const isAdmin = role === "admin";
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  const [tab, setTab] = useState<Tab>(isAdmin ? "inicio" : "balcao");
  const [prizes, setPrizes] = useState(initialPrizes);
  const [rewards, setRewards] = useState(initialRewards);
  const [prizeMode, setPrizeMode] = useState<"raspadinha" | "pontos">("raspadinha");
  const [configView, setConfigView] = useState<"home" | "equipa">("home");

  const todayLog = log.filter((r) => isToday(r.quando));

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
          <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--c-muted)" }}>Ações de hoje</div>
            <button onClick={() => { setConfigView("equipa"); setTab("config"); }} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12.5, color: "var(--c-primary)" }}>Ver mais →</button>
          </div>
          <div style={{ marginTop: 11 }}>
            <AdminLog log={todayLog} />
          </div>
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
    screen = <ReservasAdmin reservas={reservas} passadas={reservasPassadas} />;
  } else if (tab === "menu") {
    screen = <MenuAdmin menu={menu} />;
  } else if (tab === "config") {
    screen = (
      <ConfiguracoesAdmin
        me={me}
        isAdmin={isAdmin}
        isOwner={isOwner}
        meId={meId}
        members={members}
        invites={invites}
        log={log}
        foodCategories={foodCategories}
        prefStats={prefStats}
        clientes={clientes}
        landingPhotos={landingPhotos}
        initialView={configView}
        onSaved={() => router.refresh()}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{screen}</div>
      <div style={{ flexShrink: 0, display: "flex", padding: "10px 10px calc(10px + env(safe-area-inset-bottom))", background: "var(--c-surface)", borderTop: "1px solid var(--c-line)" }}>
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { if (t.id === "config") setConfigView("home"); setTab(t.id); }}
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
