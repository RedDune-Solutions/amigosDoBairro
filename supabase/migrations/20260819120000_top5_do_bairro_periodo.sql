-- =============================================================================
-- Top 5 do bairro passa a ter dois períodos: 'mes' (mês corrente Europe/Lisbon)
-- e 'sempre' (pontos ganhos lifetime). A app mostra os dois como tabs no card.
-- Mudar a assinatura = DROP + CREATE (create or replace deixaria 2 overloads
-- ambíguos no PostgREST). Grants repetidos porque a função nova nasce com os
-- default privileges do Supabase (EXECUTE a anon/authenticated).
-- =============================================================================
drop function public.top5_do_bairro(uuid);

-- DEFAULT 'mes': durante a janela entre correr este SQL e o deploy do código,
-- a chamada antiga de 1 argumento continua a resolver (PostgREST omite args com
-- default) e o card do mês fica no ar sem interrupção. Correr o SQL ANTES do push.
create function public.top5_do_bairro(p_user uuid, p_periodo text default 'mes')
returns table (posicao integer, primeiro_nome text, pontos integer, ganhos integer, proprio boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  with desde as (
    select case when p_periodo = 'sempre'
                then '-infinity'::timestamptz
                else (date_trunc('month', now() at time zone 'Europe/Lisbon') at time zone 'Europe/Lisbon')
           end as t
  ),
  pontos_periodo as (
    select l.user_id, sum(l.pontos_ganhos)::int as pts, min(l.data_criacao) as primeiro
    from public.points_lots l
    join public.profiles p on p.id = l.user_id
    where l.data_criacao >= (select t from desde)
      and p.role = 'customer' and not p.banned
    group by l.user_id
  ),
  ranked as (
    select user_id, pts,
           row_number() over (order by pts desc, primeiro asc, user_id) as rk
    from pontos_periodo
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
revoke all on function public.top5_do_bairro(uuid, text) from public, anon, authenticated;
grant execute on function public.top5_do_bairro(uuid, text) to service_role;
