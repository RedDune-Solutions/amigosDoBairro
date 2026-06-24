-- Compra + check-in opcional num único código (nonce). O check-in é 1/dia por
-- cliente (daily_checkins). Substitui o fluxo de dois botões por checkbox no pagamento.

create or replace function public.registar_compra_via_code_v3(
  p_code    text,
  p_euros   integer,
  p_checkin boolean default false
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row    public.earn_nonces%rowtype;
  v_uid    uuid;
  v_res    jsonb;
  v_dia    date;
  v_ins    integer;
  v_done   boolean := false;
  v_already boolean := false;
begin
  if not public.is_staff() then raise exception 'Apenas staff pode registar compras.'; end if;

  select * into v_row from public.earn_nonces where code = btrim(p_code) for update;
  if not found then raise exception 'Código inválido.'; end if;
  if v_row.used_at is not null then raise exception 'Código já utilizado.'; end if;
  if v_row.expires_at < now() then raise exception 'Código expirado.'; end if;

  v_uid := v_row.user_id;
  update public.earn_nonces set used_at = now() where nonce = v_row.nonce;

  -- compra (pontos + carimbo + cartola)
  v_res := public.registar_compra_v2(v_uid, p_euros)::jsonb;

  -- check-in opcional (1/dia por cliente)
  if p_checkin then
    if v_uid = auth.uid() then
      raise exception 'Não podes fazer check-in da tua própria conta.';
    end if;
    v_dia := (now() at time zone 'Europe/Lisbon')::date;
    insert into public.daily_checkins (user_id, dia) values (v_uid, v_dia) on conflict do nothing;
    get diagnostics v_ins = row_count;
    if v_ins > 0 then
      perform public._criar_lote(v_uid, 20, 'checkin', 'Check-in no café');
      v_done := true;
    else
      v_already := true;
    end if;
  end if;

  return (v_res || jsonb_build_object('checkin', v_done, 'checkin_already', v_already));
end; $$;

revoke all on function public.registar_compra_via_code_v3(text, integer, boolean) from public, anon;
grant execute on function public.registar_compra_via_code_v3(text, integer, boolean) to authenticated;
