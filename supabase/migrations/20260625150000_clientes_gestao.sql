-- =============================================================================
-- Gestão de clientes pelo admin: suspender/reativar conta + enviar aviso.
-- =============================================================================

-- Coluna de suspensão (só clientes podem ser suspensos).
alter table public.profiles add column if not exists banned boolean not null default false;

-- Permitir notificações do tipo "aviso" (avisos do admin a um cliente).
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('pontos', 'premio', 'reserva', 'novidade', 'aviso'));

-- Suspender / reativar um cliente (admin). Nunca toca em staff/admin/owner.
create or replace function public.definir_banido(p_user uuid, p_banned boolean)
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
  select role into r from public.profiles where id = p_user;
  if r is distinct from 'customer' then
    raise exception 'so clientes podem ser suspensos';
  end if;
  update public.profiles set banned = p_banned where id = p_user;
end;
$$;
revoke all on function public.definir_banido(uuid, boolean) from public, anon;
grant execute on function public.definir_banido(uuid, boolean) to authenticated;

-- Enviar um aviso (notificação in-app) a um cliente (admin).
create or replace function public.admin_enviar_aviso(p_user uuid, p_titulo text, p_corpo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if length(coalesce(p_titulo, '')) < 1 then
    raise exception 'titulo vazio';
  end if;
  insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
  values (p_user, 'aviso', p_titulo, p_titulo, nullif(p_corpo, ''), nullif(p_corpo, ''), 'bell', 'red');
end;
$$;
revoke all on function public.admin_enviar_aviso(uuid, text, text) from public, anon;
grant execute on function public.admin_enviar_aviso(uuid, text, text) to authenticated;
