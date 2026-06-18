import { Stage } from "@/design/ui";
import { AppShell } from "@/design/AppShell";
import { requireUser } from "@/lib/data";
import type { AppData, HistoryRow, RewardRow } from "@/design/data";

export const dynamic = "force-dynamic";

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
    { data: cfg },
    { data: rewardsData },
    { data: ledgerData },
    { count: scratchCount },
  ] = await Promise.all([
    supabase.from("profiles").select("nome, role, stamps, spend_toward, created_at").eq("id", user.id).single(),
    supabase.rpc("meu_saldo"),
    supabase.from("loyalty_config").select("euro_per_stamp, stamp_goal").eq("id", true).single(),
    supabase.from("rewards").select("id, titulo, nome_en, descricao, desc_en, custo_pontos, icon, accent").eq("ativo", true).order("ordem", { ascending: true }),
    supabase.from("points_ledger").select("id, delta, reason, source, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("scratch_cards").select("id", { count: "exact", head: true }).eq("status", "por-abrir"),
  ]);

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

  const data: AppData = {
    nome,
    firstName: nome.split(" ")[0],
    role: (profile?.role as AppData["role"]) ?? "customer",
    memberSince,
    points: typeof saldo === "number" ? saldo : 0,
    stamps: profile?.stamps ?? 0,
    spendToward: profile?.spend_toward ?? 0,
    euroPerStamp: cfg?.euro_per_stamp ?? 15,
    stampGoal: cfg?.stamp_goal ?? 10,
    rewards: (rewardsData ?? []) as RewardRow[],
    history,
    pendingScratch: scratchCount ?? 0,
  };

  return (
    <Stage>
      <AppShell data={data} />
    </Stage>
  );
}
