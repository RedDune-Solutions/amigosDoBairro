import { redirect } from "next/navigation";
import { Stage } from "@/design/ui";
import { AdminShell } from "@/design/AdminShell";
import { getProfile } from "@/lib/data";
import type { PrizeAdmin, RewardAdmin, AdminStatsData } from "@/design/AdminPanel";
import type { ReservaAdminRow } from "@/design/screens/admin/ReservasAdmin";
import type { MemberRow, InviteRow } from "@/design/screens/admin/EquipaScreen";
import type { AppData, NewsRow } from "@/design/data";

export const dynamic = "force-dynamic";

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
    points: 0,
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
    nextReservation: null,
  };

  const [
    { data: prizesData },
    { data: rewardsAdminData },
    { data: cfg },
    { data: resData },
    { data: membersData },
    { data: invitesData },
    { count: scratchGiven },
    { count: prizesWon },
    { count: walletUsed },
    { count: redLevantado },
    { count: activeClients },
    { data: newsData },
  ] = await Promise.all([
    isAdmin
      ? supabase.from("prizes").select("id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, weight").order("kind").order("id")
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("rewards").select("id, titulo, nome_en, descricao, desc_en, custo_pontos, icon, accent, ativo").order("ordem", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from("loyalty_config").select("euro_per_stamp, stamp_goal").eq("id", true).single(),
    supabase.from("reservations").select("id, data, hora, n_pessoas, estado, profiles(nome)").gte("data", new Date().toISOString().slice(0, 10)).order("data", { ascending: true }).order("hora", { ascending: true }).limit(60),
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
  ]);

  type Rel = { nome?: string } | { nome?: string }[] | null;
  const relNome = (p: Rel): string => (Array.isArray(p) ? p[0]?.nome : p?.nome) ?? "Cliente";

  const reservas: ReservaAdminRow[] = (resData ?? []).map((r) => ({
    id: r.id as string,
    data: r.data as string,
    hora: r.hora as string,
    n_pessoas: r.n_pessoas as number,
    estado: r.estado as string,
    cliente: relNome(r.profiles as Rel),
  }));

  const stats: AdminStatsData = {
    scratchGiven: scratchGiven ?? 0,
    prizesWon: prizesWon ?? 0,
    redeemed: (walletUsed ?? 0) + (redLevantado ?? 0),
    activeClients: activeClients ?? 0,
  };

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
        euroPerStamp={cfg?.euro_per_stamp ?? 15}
        stampGoal={cfg?.stamp_goal ?? 10}
        reservas={reservas}
        members={(membersData ?? []) as MemberRow[]}
        invites={(invitesData ?? []) as InviteRow[]}
        news={(newsData ?? []) as NewsRow[]}
      />
    </Stage>
  );
}
