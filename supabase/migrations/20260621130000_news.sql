-- Novidades do bairro — geridas pela Daniela (admin). Substituem o conteúdo
-- hardcoded da Home/Notificações. Surgem para clientes quando `ativo`.

create table public.news (
  id         uuid primary key default gen_random_uuid(),
  titulo_pt  text not null,
  titulo_en  text,
  desc_pt    text,
  desc_en    text,
  icon       text not null default 'sparkle',
  accent     text not null default 'primary',   -- primary|blue|green|red
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);
create index news_recent_idx on public.news (created_at desc);

alter table public.news enable row level security;

-- clientes vêem as activas; staff/admin vêem todas
create policy news_select on public.news
  for select to authenticated using (ativo or public.is_staff());
-- só admin gere
create policy news_admin on public.news
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.news to authenticated;

-- seed inicial (as 2 novidades que estavam hardcoded)
insert into public.news (titulo_pt, titulo_en, desc_pt, desc_en, icon, accent) values
  ('Pastéis de nata 2x1', 'Custard tarts 2-for-1', 'Todas as quartas, das 16h às 18h.', 'Every Wednesday, 4pm to 6pm.', 'cake', 'red'),
  ('Novo Prato do Dia',   'New Dish of the Day',   'Bacalhau à Brás esta semana.',      'Bacalhau à Brás this week.',   'plate', 'green');
