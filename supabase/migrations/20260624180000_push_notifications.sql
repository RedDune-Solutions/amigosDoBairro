-- Web Push (notificações no telemóvel) + campanhas segmentadas por comida preferida.
-- Sem serviços externos: VAPID + web-push a partir de server action (Node).

-- ---------- Subscriptions (uma por dispositivo) -----------------------------
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ---------- Campanhas (histórico, admin) ------------------------------------
create table public.push_campaigns (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  corpo      text not null,
  segmento   text,                 -- null = todos; senão slug de food_categories
  url        text,
  enviados   integer not null default 0,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------- RLS --------------------------------------------------------------
alter table public.push_subscriptions enable row level security;
alter table public.push_campaigns     enable row level security;

-- Cada cliente gere as suas; admin lê todas (para enviar).
create policy push_sub_select on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy push_sub_insert on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_sub_delete on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Campanhas: só admin.
create policy push_camp_admin on public.push_campaigns
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- GRANTS -----------------------------------------------------------
grant select, insert, delete on public.push_subscriptions to authenticated;
grant select, insert on public.push_campaigns to authenticated;
