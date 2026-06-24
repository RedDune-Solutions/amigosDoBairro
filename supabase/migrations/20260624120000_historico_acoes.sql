-- Registo de ações do staff (admin-only): quem deu pontos, ajustou, ou entregou
-- prémios. Junta points_ledger (creditado por staff), redemptions e wallet_items
-- (validados por staff). Só leitura — dados já existentes, sem tabela nova.
create or replace function public.historico_acoes(p_limit integer default 100)
returns table (
  quando   timestamptz,
  tipo     text,
  staff    text,
  cliente  text,
  detalhe  text,
  pontos   integer
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores.';
  end if;

  return query
  select * from (
    -- Pontos creditados/ajustados pelo staff (compra, check-in, ajuste).
    select l.created_at as quando,
           case when l.source = 'adjust' then 'Ajuste de pontos' else 'Pontos dados' end as tipo,
           coalesce(s.nome, '—') as staff,
           coalesce(c.nome, '—') as cliente,
           coalesce(l.reason, '') as detalhe,
           l.delta as pontos
      from public.points_ledger l
      left join public.profiles s on s.id = l.staff_id
      left join public.profiles c on c.id = l.user_id
     where l.staff_id is not null

    union all

    -- Prémios de pontos entregues (voucher validado no balcão).
    select r.created_at,
           'Prémio entregue (pontos)',
           coalesce(s.nome, '—'),
           coalesce(c.nome, '—'),
           coalesce(rw.titulo, '') || ' · cód ' || r.codigo,
           -r.custo_pontos
      from public.redemptions r
      left join public.profiles s on s.id = r.collected_by
      left join public.profiles c on c.id = r.user_id
      left join public.rewards rw on rw.id = r.reward_id
     where r.estado = 'levantado'

    union all

    -- Prémios de raspadinha entregues (carteira validada no balcão).
    select w.created_at,
           'Prémio entregue (raspadinha)',
           coalesce(s.nome, '—'),
           coalesce(c.nome, '—'),
           coalesce(w.nome_pt, '') || ' · cód ' || w.codigo,
           0
      from public.wallet_items w
      left join public.profiles s on s.id = w.collected_by
      left join public.profiles c on c.id = w.user_id
     where w.status = 'usado'
  ) t
  order by t.quando desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end; $$;

revoke all on function public.historico_acoes(integer) from public, anon;
grant execute on function public.historico_acoes(integer) to authenticated;
