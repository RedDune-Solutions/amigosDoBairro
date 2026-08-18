import { createServiceClient } from "@/lib/supabase/server";
import { tierIndexFor, type TopBairroRow, type TopBairroTabs } from "@/design/data";

type Top5Row = {
  posicao: number;
  primeiro_nome: string;
  pontos: number;
  ganhos: number;
  proprio: boolean;
};

/**
 * Top 5 do bairro (tab Pontos), nos dois períodos: mês corrente e sempre.
 * A agregação vive na RPC `top5_do_bairro` (SECURITY DEFINER, EXECUTE só para
 * service_role) — a RLS não deixa, nem deve deixar, um cliente ler pontos ou
 * nomes de terceiros, e somar lotes em JS rebentava no cap de 1000 linhas do
 * PostgREST. Ao browser segue apenas primeiro nome + pontos do período +
 * índice de escalão. Período vazio (ou RPC em erro) = lista vazia; a UI só
 * esconde o card quando ambos estão vazios.
 */
export async function getTopBairro(userId: string): Promise<TopBairroTabs> {
  const svc = createServiceClient();
  const [mes, sempre] = await Promise.all(
    (["mes", "sempre"] as const).map(async (p): Promise<TopBairroRow[]> => {
      const { data, error } = await svc.rpc("top5_do_bairro", { p_user: userId, p_periodo: p });
      if (error) {
        console.error(`[top-bairro] RPC falhou (${p}):`, error.message);
        return [];
      }
      return ((data ?? []) as Top5Row[]).map((r) => ({
        rank: r.posicao,
        firstName: r.primeiro_nome,
        points: r.pontos,
        tier: tierIndexFor(r.ganhos),
        isMe: r.proprio,
      }));
    }),
  );
  return { mes, sempre };
}
