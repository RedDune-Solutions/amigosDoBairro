-- =============================================================================
-- Compras com cêntimos: o valor gasto passa de `integer` → `numeric` (ex.: 8.30€).
-- Pontos = round(€ × 10) (1€ = 10 pts · cada cêntimo = 0,1 pt). Carimbo ≥15€ igual.
-- Recria registar_compra_v2 e registar_compra_via_code_v3 com o parâmetro numeric
-- (os antigos `integer` são dropados para não criar overloads ambíguos no PostgREST).
-- =============================================================================

drop function if exists public.registar_compra_via_code_v3(text, integer, boolean);
drop function if exists public.registar_compra_v2(uuid, integer);

-- Núcleo da compra (STAFF): pontos = round(€×10); carimbo se ≥15€ e <2/semana.
create function public.registar_compra_v2(p_user uuid, p_euros numeric)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pts integer; v_week integer; v_stamp boolean := false; v_full boolean := false; cur integer; newc integer;
begin
  if not public.is_staff() then raise exception 'Apenas staff pode registar compras.'; end if;
  if p_user = auth.uid() then raise exception 'Não podes registar na tua própria conta.'; end if;
  if p_euros is null or p_euros <= 0 or p_euros > 1000 then raise exception 'Valor inválido.'; end if;
  v_pts := round(p_euros * 10)::int;   -- 1€ = 10 pts (cêntimos = 0,1 pt)
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

-- Compra + check-in opcional a partir do código do cliente (STAFF). Check-in = +10.
create function public.registar_compra_via_code_v3(
  p_code text, p_euros numeric, p_checkin boolean default false
)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_row public.earn_nonces%rowtype; v_uid uuid; v_res jsonb; v_dia date;
  v_ins integer; v_done boolean := false; v_already boolean := false;
begin
  if not public.is_staff() then raise exception 'Apenas staff pode registar compras.'; end if;
  select * into v_row from public.earn_nonces where code = btrim(p_code) for update;
  if not found then raise exception 'Código inválido.'; end if;
  if v_row.used_at is not null then raise exception 'Código já utilizado.'; end if;
  if v_row.expires_at < now() then raise exception 'Código expirado.'; end if;
  v_uid := v_row.user_id;
  update public.earn_nonces set used_at = now() where nonce = v_row.nonce;
  v_res := public.registar_compra_v2(v_uid, p_euros)::jsonb;
  if p_checkin then
    if v_uid = auth.uid() then raise exception 'Não podes fazer check-in da tua própria conta.'; end if;
    v_dia := (now() at time zone 'Europe/Lisbon')::date;
    insert into public.daily_checkins (user_id, dia) values (v_uid, v_dia) on conflict do nothing;
    get diagnostics v_ins = row_count;
    if v_ins > 0 then
      perform public._criar_lote(v_uid, 10, 'checkin', 'Check-in no café');
      v_done := true;
    else
      v_already := true;
    end if;
  end if;
  return (v_res || jsonb_build_object('checkin', v_done, 'checkin_already', v_already));
end; $$;

revoke all on function public.registar_compra_v2(uuid, numeric) from public, anon;
revoke all on function public.registar_compra_via_code_v3(text, numeric, boolean) from public, anon;
grant execute on function public.registar_compra_v2(uuid, numeric) to authenticated;
grant execute on function public.registar_compra_via_code_v3(text, numeric, boolean) to authenticated;
