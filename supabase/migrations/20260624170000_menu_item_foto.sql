-- Foto opcional por item do menu (admin sobe; cliente vê foto em vez do ícone).
alter table public.menu_items add column image_url text;

-- Bucket público de fotos do menu; escrita só admin.
insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do nothing;

drop policy if exists "menu_public_read" on storage.objects;
create policy "menu_public_read" on storage.objects
  for select using (bucket_id = 'menu');

drop policy if exists "menu_admin_insert" on storage.objects;
create policy "menu_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu' and public.is_admin());

drop policy if exists "menu_admin_update" on storage.objects;
create policy "menu_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu' and public.is_admin());

drop policy if exists "menu_admin_delete" on storage.objects;
create policy "menu_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu' and public.is_admin());
