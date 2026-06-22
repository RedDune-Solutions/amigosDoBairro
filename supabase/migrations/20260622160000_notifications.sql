-- =============================================================================
-- Notificações por-utilizador, persistentes, com estado lido/não-lido + arquivo.
-- Geradas automaticamente por triggers (server-authoritative): pontos, prémios,
-- reservas confirmadas e novidades do café. O cliente só lê / marca lido / arquiva.
-- =============================================================================

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('pontos', 'premio', 'reserva', 'novidade')),
  title_pt    text not null,
  title_en    text,
  body_pt     text,
  body_en     text,
  icon        text,
  accent      text,
  read_at     timestamptz,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc) where archived_at is null;

alter table public.notifications enable row level security;

-- Cliente vê e gere SÓ as suas. A inserção é exclusiva dos triggers (definer).
create policy notif_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notif_update_own on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.notifications to authenticated;
-- Só estas colunas: o cliente marca lido/arquiva, nada mais.
grant update (read_at, archived_at) on public.notifications to authenticated;

-- =============================================================================
-- GERAÇÃO POR TRIGGERS (correm como owner → podem inserir em qualquer user_id)
-- =============================================================================

-- Pontos: cada movimento no ledger gera uma notificação para o dono.
create or replace function public.notify_points()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
  values (
    new.user_id,
    'pontos',
    case when new.delta >= 0 then '+' || new.delta || ' pontos' else new.delta || ' pontos' end,
    case when new.delta >= 0 then '+' || new.delta || ' points' else new.delta || ' points' end,
    new.reason,
    new.reason,
    case when new.delta >= 0 then 'plus' else 'gift' end,
    case when new.delta >= 0 then 'green' else 'red' end
  );
  return new;
end;
$$;
create trigger notif_on_points
  after insert on public.points_ledger
  for each row execute function public.notify_points();

-- Prémios da raspadinha: cada item de carteira gera uma notificação.
create or replace function public.notify_prize()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
  values (
    new.user_id,
    'premio',
    'Ganhaste: ' || new.nome_pt,
    'You won: ' || coalesce(new.nome_en, new.nome_pt),
    'Código ' || new.codigo,
    'Code ' || new.codigo,
    coalesce(new.icon, 'gift'),
    coalesce(new.accent, 'primary')
  );
  return new;
end;
$$;
create trigger notif_on_prize
  after insert on public.wallet_items
  for each row execute function public.notify_prize();

-- Reserva confirmada: notifica o cliente quando passa a 'confirmada'.
create or replace function public.notify_reservation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'confirmada' and new.estado is distinct from old.estado then
    insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
    values (
      new.user_id,
      'reserva',
      'Reserva confirmada',
      'Booking confirmed',
      to_char(new.data, 'DD/MM') || ' · ' || to_char(new.hora, 'HH24:MI') || ' · ' || new.n_pessoas || ' pax',
      to_char(new.data, 'DD/MM') || ' · ' || to_char(new.hora, 'HH24:MI') || ' · ' || new.n_pessoas || ' pax',
      'calendar',
      'green'
    );
  end if;
  return new;
end;
$$;
create trigger notif_on_reservation
  after update on public.reservations
  for each row execute function public.notify_reservation();

-- Novidade do café: ao publicar (insert activo) notifica todos os clientes.
create or replace function public.notify_news()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.ativo then
    insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
    select p.id, 'novidade', new.titulo_pt, new.titulo_en, new.desc_pt, new.desc_en,
           coalesce(new.icon, 'sparkle'), coalesce(new.accent, 'primary')
      from public.profiles p
     where p.role = 'customer';
  end if;
  return new;
end;
$$;
create trigger notif_on_news
  after insert on public.news
  for each row execute function public.notify_news();

-- Funções de trigger não precisam de EXECUTE a nenhum role (correm no contexto
-- do trigger). Revogar para não ficarem expostas na Data API (advisor).
revoke all on function public.notify_points() from public, anon, authenticated;
revoke all on function public.notify_prize() from public, anon, authenticated;
revoke all on function public.notify_reservation() from public, anon, authenticated;
revoke all on function public.notify_news() from public, anon, authenticated;

-- Backfill: novidades activas → notificação para cada cliente (conteúdo imediato).
insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
select p.id, 'novidade', n.titulo_pt, n.titulo_en, n.desc_pt, n.desc_en,
       coalesce(n.icon, 'sparkle'), coalesce(n.accent, 'primary')
  from public.news n
  cross join public.profiles p
 where n.ativo and p.role = 'customer';
