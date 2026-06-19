import { Stage } from "@/design/ui";
import { AdminPanel, type PrizeAdmin, type VoucherRow, type AdminStatsData } from "@/design/AdminPanel";
import { requireAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function when(iso: string): string {
  return new Date(iso).toLocaleString("pt-PT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { data: prizesData },
    { data: walletData },
    { data: redData },
    { data: cfg },
    { count: scratchGiven },
    { count: prizesWon },
    { count: walletUsed },
    { count: redLevantado },
    { count: activeClients },
  ] = await Promise.all([
    supabase.from("prizes").select("id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, weight, stock").order("kind").order("id"),
    supabase.from("wallet_items").select("id, kind, nome_pt, codigo, created_at, profiles(nome)").eq("status", "por-usar").order("created_at", { ascending: false }),
    supabase.from("redemptions").select("id, codigo, custo_pontos, created_at, profiles(nome), rewards(titulo)").eq("estado", "pendente").order("created_at", { ascending: false }),
    supabase.from("loyalty_config").select("euro_per_stamp, stamp_goal").eq("id", true).single(),
    supabase.from("scratch_cards").select("id", { count: "exact", head: true }),
    supabase.from("wallet_items").select("id", { count: "exact", head: true }),
    supabase.from("wallet_items").select("id", { count: "exact", head: true }).eq("status", "usado"),
    supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("estado", "levantado"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  const prizes = (prizesData ?? []) as PrizeAdmin[];

  type Rel = { nome?: string } | { nome?: string }[] | null;
  const relNome = (p: Rel): string => (Array.isArray(p) ? p[0]?.nome : p?.nome) ?? "Cliente";

  const vouchers: VoucherRow[] = [
    ...(walletData ?? []).map((w) => ({
      id: w.id as string,
      client: relNome(w.profiles as Rel),
      name: w.nome_pt as string,
      kind: w.kind as string,
      code: w.codigo as string,
      when: when(w.created_at as string),
    })),
    ...(redData ?? []).map((r) => {
      const rew = r.rewards as { titulo?: string } | { titulo?: string }[] | null;
      const titulo = (Array.isArray(rew) ? rew[0]?.titulo : rew?.titulo) ?? "Recompensa";
      return {
        id: r.id as string,
        client: relNome(r.profiles as Rel),
        name: titulo,
        kind: "comum",
        code: r.codigo as string,
        when: when(r.created_at as string),
      };
    }),
  ];

  const stats: AdminStatsData = {
    scratchGiven: scratchGiven ?? 0,
    prizesWon: prizesWon ?? 0,
    redeemed: (walletUsed ?? 0) + (redLevantado ?? 0),
    activeClients: activeClients ?? 0,
  };

  return (
    <Stage>
      <AdminPanel
        prizes={prizes}
        vouchers={vouchers}
        stats={stats}
        euroPerStamp={cfg?.euro_per_stamp ?? 15}
        stampGoal={cfg?.stamp_goal ?? 10}
      />
    </Stage>
  );
}
