-- =============================================================================
-- Saldo + pontos ganhos (lifetime) por cliente, para o painel de gestão de
-- clientes (admin vê escalão e pontos de cada cliente). ADITIVO.
--
-- Agrega points_lots NO SERVIDOR — devolve 1 linha por cliente em vez de enviar
-- todos os lotes ao browser (egress). Mesma definição de saldo/ganhos das RPCs
-- do cliente (meu_saldo_v2 / meus_pontos_ganhos_v2):
--   saldo  = lotes ATIVOS e não expirados (gastável)
--   ganhos = soma de pontos_ganhos de todos os lotes (nunca desce → escalão)
-- =============================================================================
create or replace function public.saldos_clientes()
returns table (user_id uuid, saldo integer, ganhos integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    l.user_id,
    coalesce(sum(l.pontos_restantes) filter (
      where l.estado = 'ATIVO' and l.data_expiracao > now()
    ), 0)::int as saldo,
    coalesce(sum(l.pontos_ganhos), 0)::int as ganhos
  from public.points_lots l
  where public.is_staff()   -- gate: sem permissão de staff/admin → nenhuma linha
  group by l.user_id;
$$;

revoke all on function public.saldos_clientes() from public, anon;
grant execute on function public.saldos_clientes() to authenticated;
