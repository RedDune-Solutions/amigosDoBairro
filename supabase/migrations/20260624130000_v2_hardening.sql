-- =============================================================================
-- Hardening V2: anti self-credit, limite de reservas, limpeza de nonces,
-- índices FK, RLS init-plan (auth.uid() em subselect) e remoção de funções V1.
-- =============================================================================

-- ---------- 1. Anti self-credit (staff não credita a própria conta) ---------
create or replace function public.registar_compra_v2(p_user uuid, p_euros integer)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pts integer; v_week integer; v_stamp boolean := false; v_full boolean := false; cur integer; newc integer;
begin
  if not public.is_staff() then raise exception 'Apenas staff pode registar compras.'; end if;
  if p_user = auth.uid() then raise exception 'Não podes registar na tua própria conta.'; end if;
  if p_euros is null or p_euros <= 0 or p_euros > 1000 then raise exception 'Valor inválido.'; end if;
  v_pts := p_euros * 10;
  perform public._criar_lote(p_user, v_pts, 'compra', 'Compra em loja');
  if p_euros >= 15 then
    select stamps into cur from public.profiles where id = p_user for update;
    select count(*) into v_week from public.stamp_events
      where user_id = p_user and created_at >= date_trunc('week', now());
    if v_week < 2 then
      insert into public.stamp_events (user_id) values (p_user);
      v_stamp := true;
      newc := coalesce(cur, 0) + 1;
      if newc >= 10 then
        newc := newc - 10; v_full := true;
        insert into public.scratch_cards (user_id, kind) values (p_user, 'comum');
        insert into public.scratch_cards (user_id, kind) values (p_user, 'especial');
      end if;
      update public.profiles set stamps = newc where id = p_user;
    end if;
  end if;
  return json_build_object('pontos', v_pts, 'carimbo', v_stamp, 'cartola', v_full);
end; $$;

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
  if v_uid = auth.uid() then raise exception 'Não podes fazer check-in da tua própria conta.'; end if;
  v_dia := (now() at time zone 'Europe/Lisbon')::date;
  insert into public.daily_checkins (user_id, dia) values (v_uid, v_dia) on conflict do nothing;
  get diagnostics v_ins = row_count;
  if v_ins = 0 then raise exception 'Check-in já feito hoje.'; end if;
  update public.earn_nonces set used_at = now() where nonce = v_row.nonce;
  perform public._criar_lote(v_uid, 20, 'checkin', 'Check-in no café');
  return json_build_object('pontos', 20);
end; $$;

create or replace function public.ajustar_pontos_v2(p_user uuid, p_pontos integer, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff() then raise exception 'Sem permissão.'; end if;
  if p_user = auth.uid() then raise exception 'Não podes creditar-te a ti próprio.'; end if;
  if p_pontos is null or p_pontos <= 0 then raise exception 'Use um valor positivo.'; end if;
  perform public._criar_lote(p_user, p_pontos, 'ajuste', coalesce(nullif(btrim(p_reason), ''), 'Ajuste manual'));
end; $$;

-- ---------- 2. Limite de reservas activas por cliente (≤3) -------------------
create or replace function public.check_reservation_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.reservations
        where user_id = new.user_id and estado <> 'cancelada' and data >= current_date) >= 3 then
    raise exception 'Limite de 3 reservas activas atingido.';
  end if;
  return new;
end; $$;
drop trigger if exists reservations_limit on public.reservations;
create trigger reservations_limit
  before insert on public.reservations
  for each row execute function public.check_reservation_limit();

-- ---------- 3. Limpeza de nonces antigos (housekeeping no momento de criar) --
create or replace function public.criar_nonce_earn()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_code text;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  -- limpar nonces velhos (usados/expirados há mais de 1 dia)
  delete from public.earn_nonces
   where (used_at is not null or expires_at < now()) and created_at < now() - interval '1 day';
  v_code := public.gen_nonce_code();
  insert into public.earn_nonces (user_id, expires_at, code)
  values (auth.uid(), now() + interval '90 seconds', v_code);
  return v_code;
end; $$;

-- ---------- 4. Índices em foreign keys (advisor performance) -----------------
create index if not exists earn_nonces_user_idx       on public.earn_nonces (user_id);
create index if not exists points_ledger_staff_idx    on public.points_ledger (staff_id);
create index if not exists redemptions_collected_idx  on public.redemptions (collected_by);
create index if not exists redemptions_reward_idx     on public.redemptions (reward_id);
create index if not exists reservations_user_idx      on public.reservations (user_id);
create index if not exists scratch_cards_prize_idx    on public.scratch_cards (prize_id);
create index if not exists staff_invites_invited_idx  on public.staff_invites (invited_by);
create index if not exists wallet_items_collected_idx on public.wallet_items (collected_by);
create index if not exists wallet_items_prize_idx     on public.wallet_items (prize_id);

-- ---------- 5. RLS init-plan: auth.uid()/is_* em subselect (cacheado) --------
alter policy profiles_select_own  on public.profiles      using (id = (select auth.uid()) or (select public.is_staff()));
alter policy profiles_update_own  on public.profiles      using (id = (select auth.uid())) with check (id = (select auth.uid()));
alter policy ledger_select        on public.points_ledger using (user_id = (select auth.uid()) or (select public.is_staff()));
alter policy redemptions_select   on public.redemptions   using (user_id = (select auth.uid()) or (select public.is_staff()));
alter policy reservations_select  on public.reservations  using (user_id = (select auth.uid()) or (select public.is_staff()));
alter policy reservations_insert  on public.reservations  with check (user_id = (select auth.uid()) and data >= current_date);
alter policy reservations_update_own on public.reservations using (user_id = (select auth.uid()) or (select public.is_staff()));
alter policy nonces_select_own    on public.earn_nonces   using (user_id = (select auth.uid()));
alter policy scratch_select       on public.scratch_cards using (user_id = (select auth.uid()) or (select public.is_staff()));
alter policy wallet_select        on public.wallet_items  using (user_id = (select auth.uid()) or (select public.is_staff()));
alter policy notif_select_own     on public.notifications using (user_id = (select auth.uid()));
alter policy notif_update_own     on public.notifications using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy lots_select_own      on public.points_lots   using (user_id = (select auth.uid()) or (select public.is_staff()));
alter policy stamp_events_select  on public.stamp_events  using (user_id = (select auth.uid()) or (select public.is_staff()));

-- ---------- 6. Remover funções V1 órfãs (substituídas pelas *_v2) ------------
drop function if exists public.meu_saldo();
drop function if exists public.meus_pontos_ganhos();
drop function if exists public.resgatar_recompensa(uuid);
drop function if exists public.registar_compra_via_code(text, integer);
drop function if exists public.registar_compra_via_nonce(uuid, integer);
drop function if exists public.creditar_via_nonce(uuid, integer, text);
drop function if exists public.registar_compra(uuid, integer);
drop function if exists public.ajustar_pontos(uuid, integer, text);
