-- =============================================================================
-- Top 5 do bairro (tab Pontos): clientes com mais pontos ganhos no mês corrente
-- (Europe/Lisbon). Agregação em SQL — somar lotes em JS rebentava no cap de
-- 1000 linhas do PostgREST (lotes acumulam para sempre; padrão igual ao de
-- saldos_clientes). EXECUTE só para service_role: a app chama com o service
-- client e envia ao browser apenas primeiro nome + pontos + escalão — a função
-- nunca fica exposta em /rest/v1 a anon/authenticated.
-- Devolve as linhas prontas a mostrar: top 5, ou top 4 + a linha do próprio
-- (posição real) quando é cliente e está fora do top; cliente sem pontos no mês
-- entra no fim com a posição a seguir ao último. 0 linhas = ninguém pontuou
-- este mês → a UI esconde a secção. Só clientes ativos entram no ranking.
-- =============================================================================
create or replace function public.top5_do_bairro(p_user uuid)
returns table (posicao integer, primeiro_nome text, pontos integer, ganhos integer, proprio boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  with inicio_mes as (
    select (date_trunc('month', now() at time zone 'Europe/Lisbon') at time zone 'Europe/Lisbon') as t
  ),
  pontos_mes as (
    select l.user_id, sum(l.pontos_ganhos)::int as pts, min(l.data_criacao) as primeiro
    from public.points_lots l
    join public.profiles p on p.id = l.user_id
    where l.data_criacao >= (select t from inicio_mes)
      and p.role = 'customer' and not p.banned
    group by l.user_id
  ),
  ranked as (
    select user_id, pts,
           row_number() over (order by pts desc, primeiro asc, user_id) as rk
    from pontos_mes
  ),
  proprio_cliente as (
    select exists (
      select 1 from public.profiles
      where id = p_user and role = 'customer' and not banned
    ) as ok
  ),
  alvo as (
    -- Top 5; se o próprio é cliente e está fora dele, a 5.ª linha dá lugar à sua.
    select user_id, pts, rk from ranked
    where rk <= case
      when exists (select 1 from ranked where user_id = p_user and rk <= 5) then 5
      when (select ok from proprio_cliente) then 4
      else 5 end
    union all
    select user_id, pts, rk from ranked
    where user_id = p_user and rk > 5
    union all
    select p_user, 0, (select count(*) + 1 from ranked)
    where (select ok from proprio_cliente)
      and exists (select 1 from ranked)
      and not exists (select 1 from ranked where user_id = p_user)
  )
  select a.rk::int,
         coalesce(nullif(split_part(btrim(coalesce(p.nome, '')), ' ', 1), ''), 'Amigo'),
         a.pts,
         (select coalesce(sum(pontos_ganhos), 0)::int
            from public.points_lots where user_id = a.user_id),
         a.user_id = p_user
  from alvo a
  join public.profiles p on p.id = a.user_id
  order by a.rk;
$$;

-- Só o servidor chama esta função (service client) — nunca o browser.
revoke all on function public.top5_do_bairro(uuid) from public, anon, authenticated;
grant execute on function public.top5_do_bairro(uuid) to service_role;
