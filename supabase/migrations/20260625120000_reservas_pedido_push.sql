-- =============================================================================
-- Reservas em "pedido": staff confirma OU recusa → cliente é notificado.
--  • Notificação in-app: estende o trigger para também cobrir 'cancelada'.
--  • Push no telemóvel: RPC para o staff ler as subscrições do cliente sem
--    precisar de service-role (SECURITY DEFINER, restrito a staff/admin).
-- =============================================================================

-- ---------- Notificação in-app: confirmada e recusada -----------------------
create or replace function public.notify_reservation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado is distinct from old.estado then
    if new.estado = 'confirmada' then
      insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
      values (
        new.user_id, 'reserva',
        'Reserva confirmada', 'Booking confirmed',
        to_char(new.data, 'DD/MM') || ' · ' || to_char(new.hora, 'HH24:MI') || ' · ' || new.n_pessoas || ' pax',
        to_char(new.data, 'DD/MM') || ' · ' || to_char(new.hora, 'HH24:MI') || ' · ' || new.n_pessoas || ' pax',
        'calendar', 'green'
      );
    elsif new.estado = 'cancelada' then
      insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
      values (
        new.user_id, 'reserva',
        'Reserva não disponível', 'Booking unavailable',
        'O café não pôde confirmar ' || to_char(new.data, 'DD/MM') || ' · ' || to_char(new.hora, 'HH24:MI') || '.',
        'The café couldn''t confirm ' || to_char(new.data, 'DD/MM') || ' · ' || to_char(new.hora, 'HH24:MI') || '.',
        'calendar', 'red'
      );
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.notify_reservation() from public, anon, authenticated;

-- ---------- Subscrições push de um utilizador (para o staff enviar) ---------
create or replace function public.push_subs_do_user(p_user uuid)
returns table (endpoint text, p256dh text, auth text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return query
    select s.endpoint, s.p256dh, s.auth
      from public.push_subscriptions s
     where s.user_id = p_user;
end;
$$;

-- Só staff/admin autenticado a pode executar; não exposta a anon.
revoke all on function public.push_subs_do_user(uuid) from public, anon;
grant execute on function public.push_subs_do_user(uuid) to authenticated;
