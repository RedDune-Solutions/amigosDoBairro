-- =============================================================================
-- Sistema de Fidelização V2 (Carimbos + Pontos FIFO) — ADITIVO.
-- Não altera funções/tabelas existentes: cria tabelas novas (points_lots,
-- stamp_events) e funções *_v2. A app só passa ao V2 quando o código novo
-- chamar estas funções. Regras FIXAS no código (server-authoritative):
--   1€ = 10 pts · registo +150 · 1º login do dia +10 · check-in +20
--   pontos em LOTES com validade 180 dias · resgate FIFO (lote mais antigo 1º)
--   carimbo: compra única ≥15€ = 1 · máx 2/semana · 10 carimbos → 2 raspadinhas
-- =============================================================================

-- ---------- Lotes de pontos (FIFO) ------------------------------------------
create table public.points_lots (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  pontos_ganhos    integer not null check (pontos_ganhos > 0),
  pontos_restantes integer not null check (pontos_restantes >= 0),
  origem           text not null check (origem in ('compra', 'registo', 'login', 'checkin', 'ajuste')),
  data_criacao     timestamptz not null default now(),
  data_expiracao   timestamptz not null,
  estado           text not null default 'ATIVO' check (estado in ('ATIVO', 'CONSUMIDO', 'EXPIRADO'))
);
create index points_lots_fifo_idx on public.points_lots (user_id, data_criacao) where estado = 'ATIVO';
alter table public.points_lots enable row level security;
create policy lots_select_own on public.points_lots
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
grant select on public.points_lots to authenticated;  -- escrita só via funções definer

-- ---------- Eventos de carimbo (para o teto semanal) ------------------------
create table public.stamp_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index stamp_events_user_idx on public.stamp_events (user_id, created_at);
alter table public.stamp_events enable row level security;
create policy stamp_events_select on public.stamp_events
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
grant select on public.stamp_events to authenticated;

-- ---------- Idempotência atómica (anti-corrida) -----------------------------
-- Garante 1 login/dia e 1 check-in/dia por utilizador via PK (não por
-- check-then-insert, que seria explorável com chamadas concorrentes).
create table public.daily_logins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dia     date not null,
  primary key (user_id, dia)
);
alter table public.daily_logins enable row level security;  -- escrita só via função definer

create table public.daily_checkins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dia     date not null,
  primary key (user_id, dia)
);
alter table public.daily_checkins enable row level security;  -- escrita só via função definer

-- Flag de bónus de registo (uma vez por conta, atómico).
alter table public.profiles add column if not exists signup_bonus boolean not null default false;

-- =============================================================================
-- FUNÇÕES V2
-- =============================================================================

-- Saldo gastável = lotes ATIVOS e ainda não expirados.
create or replace function public.meu_saldo_v2()
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(pontos_restantes), 0)::int
  from public.points_lots
  where user_id = auth.uid() and estado = 'ATIVO' and data_expiracao > now();
$$;

-- Pontos ganhos ao longo da vida (para os níveis/badges).
create or replace function public.meus_pontos_ganhos_v2()
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(pontos_ganhos), 0)::int from public.points_lots where user_id = auth.uid();
$$;

-- Helper interno: cria um lote + regista no ledger (auditoria/histórico).
create or replace function public._criar_lote(p_user uuid, p_pontos integer, p_origem text, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_pontos is null or p_pontos <= 0 then return; end if;
  insert into public.points_lots (user_id, pontos_ganhos, pontos_restantes, origem, data_expiracao)
  values (p_user, p_pontos, p_pontos, p_origem, now() + interval '180 days');
  insert into public.points_ledger (user_id, delta, reason, source, staff_id)
  values (p_user, p_pontos, p_reason,
          case when p_origem = 'ajuste' then 'adjust' else 'earn' end,
          case when p_origem in ('compra', 'checkin', 'ajuste') then auth.uid() else null end);
end; $$;

-- Registar compra (STAFF): pontos = €×10; carimbo se ≥15€ e <2/semana; 10 → 2 raspadinhas.
create or replace function public.registar_compra_v2(p_user uuid, p_euros integer)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pts   integer;
  v_week  integer;
  v_stamp boolean := false;
  v_full  boolean := false;
  cur     integer;
  newc    integer;
begin
  if not public.is_staff() then raise exception 'Apenas staff pode registar compras.'; end if;
  if p_euros is null or p_euros <= 0 or p_euros > 1000 then raise exception 'Valor inválido.'; end if;

  v_pts := p_euros * 10;
  perform public._criar_lote(p_user, v_pts, 'compra', 'Compra em loja');

  if p_euros >= 15 then
    -- bloqueia o perfil primeiro → serializa a lógica de carimbos por utilizador
    -- (evita ultrapassar o teto de 2/semana com pedidos concorrentes).
    select stamps into cur from public.profiles where id = p_user for update;
    select count(*) into v_week from public.stamp_events
      where user_id = p_user and created_at >= date_trunc('week', now());
    if v_week < 2 then
      insert into public.stamp_events (user_id) values (p_user);
      v_stamp := true;
      newc := coalesce(cur, 0) + 1;
      if newc >= 10 then
        newc := newc - 10;
        v_full := true;
        insert into public.scratch_cards (user_id, kind) values (p_user, 'comum');
        insert into public.scratch_cards (user_id, kind) values (p_user, 'especial');
      end if;
      update public.profiles set stamps = newc where id = p_user;
    end if;
  end if;

  return json_build_object('pontos', v_pts, 'carimbo', v_stamp, 'cartola', v_full);
end; $$;

-- Registar compra a partir do código curto do cliente (STAFF).
create or replace function public.registar_compra_via_code_v2(p_code text, p_euros integer)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare v_row public.earn_nonces%rowtype;
begin
  if not public.is_staff() then raise exception 'Apenas staff pode registar compras.'; end if;
  select * into v_row from public.earn_nonces where code = btrim(p_code) for update;
  if not found then raise exception 'Código inválido.'; end if;
  if v_row.used_at is not null then raise exception 'Código já utilizado.'; end if;
  if v_row.expires_at < now() then raise exception 'Código expirado.'; end if;
  update public.earn_nonces set used_at = now() where nonce = v_row.nonce;
  return public.registar_compra_v2(v_row.user_id, p_euros);
end; $$;

-- Check-in (STAFF) +20, no máximo 1 por dia (fuso Europe/Lisbon).
create or replace function public.checkin_via_code_v2(p_code text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare v_row public.earn_nonces%rowtype; v_uid uuid; v_dia date; v_ins integer;
begin
  if not public.is_staff() then raise exception 'Apenas staff.'; end if;
  select * into v_row from public.earn_nonces where code = btrim(p_code) for update;
  if not found then raise exception 'Código inválido.'; end if;
  if v_row.used_at is not null then raise exception 'Código já utilizado.'; end if;
  if v_row.expires_at < now() then raise exception 'Código expirado.'; end if;
  v_uid := v_row.user_id;
  v_dia := (now() at time zone 'Europe/Lisbon')::date;
  -- 1/dia atómico: a PK rejeita o 2º check-in do mesmo dia.
  insert into public.daily_checkins (user_id, dia) values (v_uid, v_dia)
    on conflict do nothing;
  get diagnostics v_ins = row_count;
  if v_ins = 0 then raise exception 'Check-in já feito hoje.'; end if;
  update public.earn_nonces set used_at = now() where nonce = v_row.nonce;
  perform public._criar_lote(v_uid, 20, 'checkin', 'Check-in no café');
  return json_build_object('pontos', 20);
end; $$;

-- Login diário (+10, 1/dia) + bónus de registo (+150, uma vez). Chamado pelo cliente.
create or replace function public.reclamar_login_diario_v2()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_login boolean := false; v_signup boolean := false; v_dia date; v_ins integer; v_upd integer;
begin
  if v_uid is null then raise exception 'Autenticação necessária.'; end if;
  v_dia := (now() at time zone 'Europe/Lisbon')::date;

  -- Bónus de registo (uma vez): flag atómica no perfil.
  update public.profiles set signup_bonus = true where id = v_uid and signup_bonus = false;
  get diagnostics v_upd = row_count;
  if v_upd > 0 then perform public._criar_lote(v_uid, 150, 'registo', 'Bónus de registo'); v_signup := true; end if;

  -- Login diário (1/dia): PK rejeita repetição no mesmo dia.
  insert into public.daily_logins (user_id, dia) values (v_uid, v_dia) on conflict do nothing;
  get diagnostics v_ins = row_count;
  if v_ins > 0 then perform public._criar_lote(v_uid, 10, 'login', 'Login diário'); v_login := true; end if;

  return json_build_object('login', v_login, 'signup', v_signup);
end; $$;

-- Resgatar recompensa (CLIENTE) — debita FIFO (lote mais antigo primeiro).
create or replace function public.resgatar_recompensa_v2(p_reward uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid    uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_saldo  integer;
  v_falta  integer;
  v_codigo text;
  lot      record;
begin
  if v_uid is null then raise exception 'Autenticação necessária.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select * into v_reward from public.rewards where id = p_reward for update;
  if not found or not v_reward.ativo then raise exception 'Recompensa indisponível.'; end if;
  if v_reward.stock is not null and v_reward.stock <= 0 then raise exception 'Recompensa esgotada.'; end if;

  select coalesce(sum(pontos_restantes), 0)::int into v_saldo from public.points_lots
    where user_id = v_uid and estado = 'ATIVO' and data_expiracao > now();
  if v_saldo < v_reward.custo_pontos then raise exception 'Pontos insuficientes.'; end if;

  v_falta := v_reward.custo_pontos;
  for lot in
    select * from public.points_lots
    where user_id = v_uid and estado = 'ATIVO' and data_expiracao > now()
    order by data_criacao asc
    for update
  loop
    exit when v_falta <= 0;
    if lot.pontos_restantes <= v_falta then
      v_falta := v_falta - lot.pontos_restantes;
      update public.points_lots set pontos_restantes = 0, estado = 'CONSUMIDO' where id = lot.id;
    else
      update public.points_lots set pontos_restantes = pontos_restantes - v_falta where id = lot.id;
      v_falta := 0;
    end if;
  end loop;

  insert into public.points_ledger (user_id, delta, reason, source)
  values (v_uid, -v_reward.custo_pontos, 'Resgate: ' || v_reward.titulo, 'redeem');
  if v_reward.stock is not null then update public.rewards set stock = stock - 1 where id = p_reward; end if;

  v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.redemptions (user_id, reward_id, custo_pontos, codigo)
  values (v_uid, p_reward, v_reward.custo_pontos, v_codigo);
  return v_codigo;
end; $$;

-- Ajuste manual (STAFF/ADMIN) — cupões/correções positivas → cria lote.
create or replace function public.ajustar_pontos_v2(p_user uuid, p_pontos integer, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff() then raise exception 'Sem permissão.'; end if;
  if p_pontos is null or p_pontos <= 0 then raise exception 'Use um valor positivo.'; end if;
  perform public._criar_lote(p_user, p_pontos, 'ajuste', coalesce(nullif(btrim(p_reason), ''), 'Ajuste manual'));
end; $$;

-- Manutenção opcional: marcar lotes vencidos como EXPIRADO (para relatórios).
create or replace function public.expirar_lotes()
returns integer language sql security definer set search_path = public, pg_temp as $$
  with x as (
    update public.points_lots set estado = 'EXPIRADO'
    where estado = 'ATIVO' and data_expiracao <= now() and pontos_restantes > 0
    returning 1
  ) select count(*)::int from x;
$$;

-- =============================================================================
-- GRANTS — revoga anon (default privileges do Supabase) e dá só a authenticated.
-- _criar_lote e expirar_lotes são internos → sem grant a ninguém.
-- =============================================================================
revoke all on function public._criar_lote(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.expirar_lotes() from public, anon, authenticated;

revoke all on function public.meu_saldo_v2() from public, anon;
revoke all on function public.meus_pontos_ganhos_v2() from public, anon;
revoke all on function public.registar_compra_v2(uuid, integer) from public, anon;
revoke all on function public.registar_compra_via_code_v2(text, integer) from public, anon;
revoke all on function public.checkin_via_code_v2(text) from public, anon;
revoke all on function public.reclamar_login_diario_v2() from public, anon;
revoke all on function public.resgatar_recompensa_v2(uuid) from public, anon;
revoke all on function public.ajustar_pontos_v2(uuid, integer, text) from public, anon;

grant execute on function public.meu_saldo_v2() to authenticated;
grant execute on function public.meus_pontos_ganhos_v2() to authenticated;
grant execute on function public.registar_compra_v2(uuid, integer) to authenticated;
grant execute on function public.registar_compra_via_code_v2(text, integer) to authenticated;
grant execute on function public.checkin_via_code_v2(text) to authenticated;
grant execute on function public.reclamar_login_diario_v2() to authenticated;
grant execute on function public.resgatar_recompensa_v2(uuid) to authenticated;
grant execute on function public.ajustar_pontos_v2(uuid, integer, text) to authenticated;

-- NOTA: o re-escalar dos custos das recompensas (×10, escala 1€=10pts) NÃO é
-- feito aqui de propósito — mexer em rewards.custo_pontos partiria os preços da
-- app ATUAL (ainda 1€=1pt) antes do código V2 entrar. Fazer no cutover/deploy:
--   update public.rewards set custo_pontos = custo_pontos * 10;
