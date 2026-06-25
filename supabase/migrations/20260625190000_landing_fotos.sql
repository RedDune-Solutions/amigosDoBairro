-- =============================================================================
-- Fotos da landing page editáveis pela admin (carrossel de "Ambiente" + fotos de
-- "Da nossa casa"). Leitura pública (a landing é vista por visitantes anónimos);
-- gestão só admin. Convenções: secure-by-default → RLS + GRANT explícito + bucket
-- de storage com escrita restrita a admin (espelha o bucket 'menu').
-- =============================================================================

create table public.landing_photos (
  id         uuid primary key default gen_random_uuid(),
  -- 'espaco' = carrossel de ambiente (sem legenda); 'comida' = "Da nossa casa" (com legenda).
  section    text not null check (section in ('espaco', 'comida')),
  image_url  text not null,
  label_pt   text,
  label_en   text,
  ordem      integer not null default 0,
  created_at timestamptz not null default now()
);
create index landing_photos_section_idx on public.landing_photos (section, ordem);

-- ---------- RLS --------------------------------------------------------------
alter table public.landing_photos enable row level security;

create policy landing_read  on public.landing_photos
  for select to anon, authenticated using (true);
create policy landing_admin on public.landing_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- GRANTS -----------------------------------------------------------
grant select on public.landing_photos to anon, authenticated;
grant insert, update, delete on public.landing_photos to authenticated;

-- ---------- Bucket de storage (fotos novas que a admin sobe) ------------------
insert into storage.buckets (id, name, public)
values ('landing', 'landing', true)
on conflict (id) do nothing;

drop policy if exists "landing_public_read" on storage.objects;
create policy "landing_public_read" on storage.objects
  for select using (bucket_id = 'landing');

drop policy if exists "landing_admin_insert" on storage.objects;
create policy "landing_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'landing' and public.is_admin());

drop policy if exists "landing_admin_update" on storage.objects;
create policy "landing_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'landing' and public.is_admin());

drop policy if exists "landing_admin_delete" on storage.objects;
create policy "landing_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'landing' and public.is_admin());

-- ---------- Seed: espelha as fotos estáticas actuais do design ---------------
-- Ambiente (carrossel) — sem legenda.
insert into public.landing_photos (section, image_url, ordem) values
  ('espaco', '/galeria/foto-10.jpg',      1),
  ('espaco', '/galeria/foto-06.jpg',      2),
  ('espaco', '/galeria/burger-sumos.jpg', 3),
  ('espaco', '/galeria/foto-05.jpg',      4),
  ('espaco', '/galeria/foto-14.jpg',      5);

-- "Da nossa casa" (comida) — com legenda PT/EN.
insert into public.landing_photos (section, image_url, label_pt, label_en, ordem) values
  ('comida', '/galeria/foto-19.jpg', 'Panquecas',       'Pancakes',    1),
  ('comida', '/galeria/foto-08.jpg', 'Brunch',          'Brunch',      2),
  ('comida', '/galeria/foto-18.jpg', 'Bagel com ovo',   'Egg bagel',   3),
  ('comida', '/galeria/foto-11.jpg', 'Bowl saudável',   'Healthy bowl',4),
  ('comida', '/galeria/foto-15.jpg', 'Sandes',          'Sandwich',    5),
  ('comida', '/galeria/foto-13.jpg', 'Muffin com ovo',  'Egg muffin',  6),
  ('comida', '/galeria/foto-02.jpg', 'Brownie',         'Brownie',     7),
  ('comida', '/galeria/foto-03.jpg', 'Taça de iogurte', 'Yogurt bowl', 8);
