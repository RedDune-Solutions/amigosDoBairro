import { createServiceClient } from "@/lib/supabase/server";
import { tierIndexFor, type TopBairroRow } from "@/design/data";

type Top5Row = {
  posicao: number;
  primeiro_nome: string;
  pontos: number;
  ganhos: number;
  proprio: boolean;
};

/**
 * Top 5 do bairro (tab Pontos): os clientes com mais pontos ganhos este mês.
 * A agregação vive na RPC `top5_do_bairro` (SECURITY DEFINER, EXECUTE só para
 * service_role) — a RLS não deixa, nem deve deixar, um cliente ler pontos ou
 * nomes de terceiros, e somar lotes em JS rebentava no cap de 1000 linhas do
 * PostgREST. Ao browser segue apenas primeiro nome + pontos do mês + índice de
 * escalão — os ganhos lifetime de terceiros ficam no servidor.
 * Lista vazia = ninguém pontuou este mês (ou RPC ainda não aplicada) → a UI
 * esconde a secção.
 */
export async function getTopBairro(userId: string): Promise<TopBairroRow[]> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("top5_do_bairro", { p_user: userId });
  if (error) {
    console.error("[top-bairro] RPC falhou:", error.message);
    return [];
  }
  return ((data ?? []) as Top5Row[]).map((r) => ({
    rank: r.posicao,
    firstName: r.primeiro_nome,
    points: r.pontos,
    tier: tierIndexFor(r.ganhos),
    isMe: r.proprio,
  }));
}
