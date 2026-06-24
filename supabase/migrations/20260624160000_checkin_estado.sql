-- Estado de check-in de um código SEM o consumir (para desativar a checkbox no
-- balcão quando o cliente já fez check-in hoje). Só leitura, staff-only.
create or replace function public.checkin_estado_por_code(p_code text)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_row    public.earn_nonces%rowtype;
  v_dia    date;
  v_exists boolean;
begin
  if not public.is_staff() then raise exception 'Apenas staff.'; end if;
  select * into v_row from public.earn_nonces where code = btrim(p_code);
  if not found or v_row.used_at is not null or v_row.expires_at < now() then
    return json_build_object('valid', false, 'already', false);
  end if;
  v_dia := (now() at time zone 'Europe/Lisbon')::date;
  select exists (
    select 1 from public.daily_checkins where user_id = v_row.user_id and dia = v_dia
  ) into v_exists;
  return json_build_object('valid', true, 'already', v_exists);
end; $$;

revoke all on function public.checkin_estado_por_code(text) from public, anon;
grant execute on function public.checkin_estado_por_code(text) to authenticated;
