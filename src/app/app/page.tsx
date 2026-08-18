import { redirect } from "next/navigation";
import { Stage } from "@/design/ui";
import { AppShell } from "@/design/AppShell";
import { requireUser } from "@/lib/data";
import { getMenu, getFoodCategories } from "@/lib/menu-actions";
import { getTopBairro } from "@/lib/top-bairro";
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

  // "Agora" em Lisboa (data + hora): reservas cuja data+hora já passou saem da lista.
  const _np = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date());
  const _nv = (t: string) => _np.find((x) => x.type === t)?.value ?? "00";
  const hojeLisboa = `${_nv("year")}-${_nv("month")}-${_nv("day")}`;
  const horaLisboa = `${_nv("hour")}:${_nv("minute")}:${_nv("second")}`;
  const reservaFutura = `data.gt.${hojeLisboa},and(data.eq.${hojeLisboa},hora.gte.${horaLisboa})`;

  const [
    { data: profile },
    { data: saldo },
    { data: ganhos },
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
    menu,
    foodCategories,
    topBairro,
  ] = await Promise.all([
    supabase.from("profiles").select("nome, telefone, avatar_url, role, stamps, spend_toward, created_at, food_pref, banned, reservas_bloqueadas, email_notifs").eq("id", user.id).single(),
    supabase.rpc("meu_saldo_v2"),
    supabase.rpc("meus_pontos_ganhos_v2"),
    supabase.from("rewards").select("id, titulo, nome_en, descricao, desc_en, custo_pontos, icon, accent").eq("ativo", true).order("custo_pontos", { ascending: true }),
    supabase.from("points_ledger").select("id, delta, reason, source, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("scratch_cards").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "por-abrir"),
    supabase.from("scratch_cards").select("id, kind").eq("user_id", user.id).eq("status", "por-abrir").order("created_at", { ascending: true }),
    supabase.from("wallet_items").select("id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, codigo, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("redemptions").select("id, codigo, estado, created_at, rewards(titulo, nome_en, descricao, desc_en, icon, accent)").eq("user_id", user.id).neq("estado", "cancelado").order("created_at", { ascending: false }).limit(30),
    supabase.from("reservations").select("id, data, hora, n_pessoas, estado").eq("user_id", user.id).eq("arquivada", false).or(reservaFutura).order("data", { ascending: true }).order("hora", { ascending: true }).limit(20),
    supabase.from("news").select("id, titulo_pt, titulo_en, desc_pt, desc_en, icon, accent, ativo, created_at").eq("ativo", true).order("created_at", { ascending: false }).limit(10),
    supabase.from("notifications").select("id, kind, title_pt, title_en, body_pt, body_en, icon, accent, read_at, created_at").eq("user_id", user.id).is("archived_at", null).order("created_at", { ascending: false }).limit(40),
    supabase.from("points_lots").select("pontos_restantes, data_expiracao").eq("user_id", user.id).eq("estado", "ATIVO").gt("data_expiracao", new Date().toISOString()).order("data_expiracao", { ascending: true }),
    getMenu(),
    getFoodCategories(),
    // Leaderboard é decorativo — nunca deitar o ecrã abaixo por causa dele.
    getTopBairro(user.id).catch((e) => {
      console.error("[top-bairro]", e);
      return [];
    }),
  ]);

  // Conta suspensa pelo admin → terminar sessão e mostrar aviso no login.
  if ((profile as { banned?: boolean } | null)?.banned) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/entrar?suspended=1");
  }

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
    euroPerStamp: 15,
    stampGoal: 10,
    rewards: (rewardsData ?? []) as RewardRow[],
    history,
    pendingScratch: scratchCount ?? 0,
    scratchCards: (scratchData ?? []) as AppData["scratchCards"],
    wallet,
    news: (newsData ?? []) as AppData["news"],
    notifications: (notifData ?? []) as NotifRow[],
    unread: (notifData ?? []).filter((n) => n.read_at === null).length,
    expiring,
    reservations: (nextRes ?? []).map((r) => ({
      id: r.id as string,
      data: r.data as string,
      hora: r.hora as string,
      n_pessoas: r.n_pessoas as number,
      estado: r.estado as string,
    })),
    reservasBloqueadas: Boolean((profile as { reservas_bloqueadas?: boolean } | null)?.reservas_bloqueadas),
    emailNotifs: Boolean((profile as { email_notifs?: boolean } | null)?.email_notifs),
    topBairro,
  };

  return (
    <Stage>
      <AppShell data={data} menu={menu} foodCategories={foodCategories} />
    </Stage>
  );
}
