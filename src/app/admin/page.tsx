import { redirect } from "next/navigation";
import { Stage } from "@/design/ui";
import { AdminShell } from "@/design/AdminShell";
import { getProfile } from "@/lib/data";
import { getMenu, getFoodCategories, getFoodPrefStats } from "@/lib/menu-actions";
import { getLandingPhotos } from "@/lib/landing-actions";
import type { PrizeAdmin, RewardAdmin, AdminStatsData, LogRow } from "@/design/AdminPanel";
import type { ReservaAdminRow } from "@/design/screens/admin/ReservasAdmin";
import type { MemberRow, InviteRow } from "@/design/screens/admin/EquipaScreen";
import type { AppData, NewsRow, ClienteRow } from "@/design/data";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default async function AdminPage() {
  const { profile, supabase } = await getProfile();
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) redirect("/app");
  const isAdmin = profile.role === "admin";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const created = profile.created_at ? new Date(profile.created_at) : new Date();
  const me: AppData = {
    nome: profile.nome ?? "Equipa",
    firstName: (profile.nome ?? "Equipa").split(" ")[0],
    email: user?.email ?? "",
    telefone: profile.telefone ?? "",
    avatarUrl: (profile as { avatar_url?: string | null }).avatar_url ?? null,
    role: profile.role as AppData["role"],
    memberSince: `${MESES[created.getMonth()]} ${created.getFullYear()}`,
    foodPref: null,
    points: 0,
    earned: 0,
    stamps: 0,
    spendToward: 0,
    euroPerStamp: 15,
    stampGoal: 10,
    rewards: [],
    history: [],
    pendingScratch: 0,
    scratchCards: [],
    wallet: [],
    news: [],
    notifications: [],
    unread: 0,
    expiring: null,
    reservations: [],
    reservasBloqueadas: false,
  };

  // "Agora" em Lisboa (data + hora). Reservas cuja data+hora já passou saem da
  // lista — não faz sentido aceitar uma reserva de um horário que já passou.
  const _np = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date());
  const _nv = (t: string) => _np.find((x) => x.type === t)?.value ?? "00";
  const hojeLisboa = `${_nv("year")}-${_nv("month")}-${_nv("day")}`;
  const horaLisboa = `${_nv("hour")}:${_nv("minute")}:${_nv("second")}`;
  const reservaFutura = `data.gt.${hojeLisboa},and(data.eq.${hojeLisboa},hora.gte.${horaLisboa})`;
  // Complemento exato de reservaFutura — o Histórico mostra o que já passou.
  const reservaPassada = `data.lt.${hojeLisboa},and(data.eq.${hojeLisboa},hora.lt.${horaLisboa})`;

  const [
    { data: prizesData },
    { data: rewardsAdminData },
    { data: resData },
    { data: resPassadasData },
    { data: membersData },
    { data: invitesData },
    { count: scratchGiven },
    { count: prizesWon },
    { count: walletUsed },
    { count: redLevantado },
    { count: activeClients },
    { data: newsData },
    { data: logData },
    { data: clientesData },
    { data: saldosData },
  ] = await Promise.all([
    isAdmin
      ? supabase.from("prizes").select("id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, weight").order("kind").order("id")
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("rewards").select("id, titulo, nome_en, descricao, desc_en, custo_pontos, icon, accent, ativo").order("custo_pontos", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from("reservations").select("id, data, hora, n_pessoas, estado, profiles(nome)").or(reservaFutura).order("data", { ascending: true }).order("hora", { ascending: true }).limit(60),
    supabase.from("reservations").select("id, data, hora, n_pessoas, estado, profiles(nome)").or(reservaPassada).order("data", { ascending: false }).order("hora", { ascending: false }).limit(60),
    isAdmin
      ? supabase.from("profiles").select("id, nome, role, is_owner").in("role", ["staff", "admin"]).order("role")
      : Promise.resolve({ data: [] }),
    isAdmin ? supabase.from("staff_invites").select("email, role") : Promise.resolve({ data: [] }),
    isAdmin ? supabase.from("scratch_cards").select("id", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
    isAdmin ? supabase.from("wallet_items").select("id", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
    isAdmin ? supabase.from("wallet_items").select("id", { count: "exact", head: true }).eq("status", "usado") : Promise.resolve({ count: 0 }),
    isAdmin ? supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("estado", "levantado") : Promise.resolve({ count: 0 }),
    isAdmin ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer") : Promise.resolve({ count: 0 }),
    isAdmin ? supabase.from("news").select("id, titulo_pt, titulo_en, desc_pt, desc_en, icon, accent, ativo, created_at").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    isAdmin ? supabase.rpc("historico_acoes", { p_limit: 100 }) : Promise.resolve({ data: [] }),
    isAdmin ? supabase.from("profiles").select("id, nome, telefone, food_pref, created_at, banned, reservas_bloqueadas").eq("role", "customer").order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
    isAdmin ? supabase.rpc("saldos_clientes") : Promise.resolve({ data: [] }),
  ]);

  type Rel = { nome?: string } | { nome?: string }[] | null;
  const relNome = (p: Rel): string => (Array.isArray(p) ? p[0]?.nome : p?.nome) ?? "Cliente";

  const toRow = (r: { id: unknown; data: unknown; hora: unknown; n_pessoas: unknown; estado: unknown; profiles: unknown }): ReservaAdminRow => ({
    id: r.id as string,
    data: r.data as string,
    hora: r.hora as string,
    n_pessoas: r.n_pessoas as number,
    estado: r.estado as string,
    cliente: relNome(r.profiles as Rel),
  });
  const reservas: ReservaAdminRow[] = (resData ?? []).map(toRow);
  const reservasPassadas: ReservaAdminRow[] = (resPassadasData ?? []).map(toRow);

  const stats: AdminStatsData = {
    scratchGiven: scratchGiven ?? 0,
    prizesWon: prizesWon ?? 0,
    redeemed: (walletUsed ?? 0) + (redLevantado ?? 0),
    activeClients: activeClients ?? 0,
  };

  // Funde saldo + ganhos (escalão) por cliente. A RPC devolve 1 linha por
  // cliente com lotes; quem nunca ganhou pontos fica a 0 (escalão "Vizinho Novo").
  const saldoMap = new Map<string, { saldo: number; ganhos: number }>();
  for (const s of (saldosData ?? []) as { user_id: string; saldo: number; ganhos: number }[]) {
    saldoMap.set(s.user_id, { saldo: s.saldo, ganhos: s.ganhos });
  }
  const clientes = ((clientesData ?? []) as Omit<ClienteRow, "saldo" | "ganhos">[]).map((c) => ({
    ...c,
    saldo: saldoMap.get(c.id)?.saldo ?? 0,
    ganhos: saldoMap.get(c.id)?.ganhos ?? 0,
  }));

  const [menu, foodCategories, prefStats, landingPhotos] = await Promise.all([
    getMenu(),
    isAdmin ? getFoodCategories(false) : Promise.resolve([]),
    isAdmin ? getFoodPrefStats() : Promise.resolve([]),
    isAdmin ? getLandingPhotos() : Promise.resolve({ espaco: [], comida: [] }),
  ]);

  return (
    <Stage>
      <AdminShell
        role={profile.role as "staff" | "admin"}
        nome={profile.nome ?? "Equipa"}
        isOwner={Boolean((profile as { is_owner?: boolean }).is_owner)}
        meId={user?.id ?? profile.id}
        me={me}
        prizes={(prizesData ?? []) as PrizeAdmin[]}
        rewards={(rewardsAdminData ?? []) as RewardAdmin[]}
        stats={stats}
        reservas={reservas}
        reservasPassadas={reservasPassadas}
        members={(membersData ?? []) as MemberRow[]}
        invites={(invitesData ?? []) as InviteRow[]}
        news={(newsData ?? []) as NewsRow[]}
        log={(logData ?? []) as LogRow[]}
        menu={menu}
        foodCategories={foodCategories}
        prefStats={prefStats}
        clientes={clientes}
        landingPhotos={landingPhotos}
      />
    </Stage>
  );
}
