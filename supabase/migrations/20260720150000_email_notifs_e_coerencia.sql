-- =============================================================================
-- Coerência de notificações (auditoria 2026-07-20):
--  1. profiles.email_notifs — toggle de emails do cliente (por conta, opt-in).
--     O cliente atualiza o próprio via grant de coluna (padrão food_pref).
--  2. admin_campanha_inapp — campanhas do admin passam a ficar TAMBÉM na app
--     (fan-out em notifications; antes só existiam em push e quem não tinha
--     push ativo nunca as via).
--  3. admin_emails_notif — lista de emails dos clientes com email_notifs ativo
--     (para campanhas por email; SECURITY DEFINER lê auth.users, gate admin).
--  4. admin_enviar_aviso — hardening: passa a validar role='customer' na BD
--     (antes só a UI limitava o alvo a clientes).
-- =============================================================================

-- ---------- 1. Toggle de emails (conta) --------------------------------------
alter table public.profiles add column if not exists email_notifs boolean not null default false;
-- Cliente grava a própria preferência (RLS profiles_update_own garante id = auth.uid()).
grant update (email_notifs) on public.profiles to authenticated;

-- ---------- 2. Campanha do admin → notificações in-app -----------------------
-- Fan-out para clientes (todos ou só o segmento food_pref). kind='novidade'
-- (mesmo tratamento visual das novidades). Devolve nº de clientes notificados.
create or replace function public.admin_campanha_inapp(
  p_titulo text, p_corpo text, p_segmento text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if length(btrim(coalesce(p_titulo, ''))) < 2 then
    raise exception 'titulo vazio';
  end if;
  insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
  select p.id, 'novidade', p_titulo, p_titulo, nullif(btrim(coalesce(p_corpo, '')), ''), nullif(btrim(coalesce(p_corpo, '')), ''), 'sparkle', 'primary'
  from public.profiles p
  where p.role = 'customer'
    and (nullif(btrim(coalesce(p_segmento, '')), '') is null or p.food_pref = btrim(p_segmento));
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.admin_campanha_inapp(text, text, text) from public, anon;
grant execute on function public.admin_campanha_inapp(text, text, text) to authenticated;

-- ---------- 3. Emails dos clientes com emails ativos -------------------------
create or replace function public.admin_emails_notif(p_segmento text)
returns table (email text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'customer'
    and p.email_notifs
    and u.email is not null
    and (nullif(btrim(coalesce(p_segmento, '')), '') is null or p.food_pref = btrim(p_segmento));
end;
$$;
revoke all on function public.admin_emails_notif(text) from public, anon;
grant execute on function public.admin_emails_notif(text) to authenticated;

-- ---------- 4. Aviso do admin: só clientes (hardening) -----------------------
create or replace function public.admin_enviar_aviso(p_user uuid, p_titulo text, p_corpo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if length(coalesce(p_titulo, '')) < 1 then
    raise exception 'titulo vazio';
  end if;
  select role into r from public.profiles where id = p_user;
  if r is distinct from 'customer' then
    raise exception 'so clientes';
  end if;
  insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
  values (p_user, 'aviso', p_titulo, p_titulo, nullif(p_corpo, ''), nullif(p_corpo, ''), 'bell', 'red');
end;
$$;
