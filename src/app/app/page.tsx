import { Stage } from "@/design/ui";
import { AppShell } from "@/design/AppShell";
import { requireUser } from "@/lib/data";
import { getMenu, getFoodCategories } from "@/lib/menu-actions";
import type { AppData, HistoryRow, RewardRow, WalletItemRow, NotifRow } from "@/design/data";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function sourceLabel(s: string, reason: string | null): string {
  if (reason) return reason;
  return s === "earn" ? "Pontos ganhos" : s === "redeem" ? "Resgate" : "Ajuste";
}

export default async function AppPage() {
  const { supabase, user } = await requireUser();

  const [
    { data: profile },
    { data: saldo },
    { data: ganhos },
    { data: cfg },
    { data: rewardsData },
    { data: ledgerData },
    { count: scratchCount },
    { data: scratchData },
    { data: walletData },
    { data: redemptionsData },
    { data: nextRes },
    { data: newsData },
    { data: notifData },
    { data: lotsData },
  ] = await Promise.all([
    supabase.from("profiles").select("nome, telefone, avatar_url, role, stamps, spend_toward, created_at, food_pref").eq("id", user.id).single(),
    supabase.rpc("meu_saldo_v2"),
    supabase.rpc("meus_pontos_ganhos_v2"),
    supabase.from("loyalty_config").select("euro_per_stamp, stamp_goal").eq("id", true).single(),
    supabase.from("rewards").select("id, titulo, nome_en, descricao, desc_en, custo_pontos, icon, accent").eq("ativo", true).order("ordem", { ascending: true }),
    supabase.from("points_ledger").select("id, delta, reason, source, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("scratch_cards").select("id", { count: "exact", head: true }).eq("status", "por-abrir"),
    supabase.from("scratch_cards").select("id, kind").eq("status", "por-abrir").order("created_at", { ascending: true }),
    supabase.from("wallet_items").select("id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, codigo, status, created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("redemptions").select("id, codigo, estado, created_at, rewards(titulo, nome_en, descricao, desc_en, icon, accent)").neq("estado", "cancelado").order("created_at", { ascending: false }).limit(30),
    supabase.from("reservations").select("data, hora, n_pessoas, estado").gte("data", new Date().toISOString().slice(0, 10)).neq("estado", "cancelada").order("data", { ascending: true }).order("hora", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("news").select("id, titulo_pt, titulo_en, desc_pt, desc_en, icon, accent, ativo, created_at").eq("ativo", true).order("created_at", { ascending: false }).limit(10),
    supabase.from("notifications").select("id, kind, title_pt, title_en, body_pt, body_en, icon, accent, read_at, created_at").is("archived_at", null).order("created_at", { ascending: false }).limit(40),
    supabase.from("points_lots").select("pontos_restantes, data_expiracao").eq("estado", "ATIVO").gt("data_expiracao", new Date().toISOString()).order("data_expiracao", { ascending: true }),
  ]);

  // Pontos a expirar nos próximos 30 dias (FIFO V2).
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const lots = (lotsData ?? []) as { pontos_restantes: number; data_expiracao: string }[];
  const soonPts = lots
    .filter((l) => new Date(l.data_expiracao).getTime() - nowMs <= 30 * 86400000)
    .reduce((s, l) => s + l.pontos_restantes, 0);
  const expiring =
    soonPts > 0 && lots[0]
      ? { pts: soonPts, dias: Math.max(0, Math.ceil((new Date(lots[0].data_expiracao).getTime() - nowMs) / 86400000)) }
      : null;

  const created = profile?.created_at ? new Date(profile.created_at) : new Date();
  const memberSince = `${MESES[created.getMonth()]} ${created.getFullYear()}`;
  const metaNome = (user.user_metadata?.nome as string | undefined) ?? undefined;
  const nome: string = profile?.nome ?? metaNome ?? "Amigo";

  const history: HistoryRow[] = (ledgerData ?? []).map((e) => ({
    id: e.id as number,
    label: sourceLabel(e.source as string, e.reason as string | null),
    date: new Date(e.created_at as string).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    pts: e.delta as number,
    kind: e.source as HistoryRow["kind"],
  }));

  // Carteira unificada: prémios de raspadinha (wallet_items) + recompensas
  // compradas com pontos (redemptions), ambas com código para mostrar ao balcão.
  type RewRel = { titulo?: string; nome_en?: string | null; descricao?: string | null; desc_en?: string | null; icon?: string | null; accent?: string | null };
  const relReward = (r: RewRel | RewRel[] | null): RewRel => (Array.isArray(r) ? (r[0] ?? {}) : (r ?? {}));
  const redemptionWallet: WalletItemRow[] = (redemptionsData ?? []).map((r) => {
    const rw = relReward(r.rewards as RewRel | RewRel[] | null);
    return {
      id: `red_${r.id as string}`,
      kind: "recompensa",
      nome_pt: rw.titulo ?? "Recompensa",
      nome_en: rw.nome_en ?? null,
      desc_pt: rw.descricao ?? null,
      desc_en: rw.desc_en ?? null,
      icon: rw.icon ?? "gift",
      accent: rw.accent ?? "primary",
      codigo: r.codigo as string,
      status: (r.estado as string) === "levantado" ? "usado" : "por-usar",
      created_at: r.created_at as string,
    };
  });
  const wallet: WalletItemRow[] = [...((walletData ?? []) as WalletItemRow[]), ...redemptionWallet].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );

  const data: AppData = {
    nome,
    firstName: nome.split(" ")[0],
    email: user.email ?? "",
    telefone: profile?.telefone ?? "",
    avatarUrl: (profile?.avatar_url as string | null) ?? null,
    role: (profile?.role as AppData["role"]) ?? "customer",
    memberSince,
    foodPref: (profile?.food_pref as string | null) ?? null,
    points: typeof saldo === "number" ? saldo : 0,
    earned: typeof ganhos === "number" ? ganhos : 0,
    stamps: profile?.stamps ?? 0,
    spendToward: profile?.spend_toward ?? 0,
    euroPerStamp: cfg?.euro_per_stamp ?? 15,
    stampGoal: cfg?.stamp_goal ?? 10,
    rewards: (rewardsData ?? []) as RewardRow[],
    history,
    pendingScratch: scratchCount ?? 0,
    scratchCards: (scratchData ?? []) as AppData["scratchCards"],
    wallet,
    news: (newsData ?? []) as AppData["news"],
    notifications: (notifData ?? []) as NotifRow[],
    unread: (notifData ?? []).filter((n) => n.read_at === null).length,
    expiring,
    nextReservation: nextRes
      ? {
          data: nextRes.data as string,
          hora: nextRes.hora as string,
          n_pessoas: nextRes.n_pessoas as number,
          estado: nextRes.estado as string,
        }
      : null,
  };

  const [menu, foodCategories] = await Promise.all([getMenu(), getFoodCategories()]);

  return (
    <Stage>
      <AppShell data={data} menu={menu} foodCategories={foodCategories} />
    </Stage>
  );
}
