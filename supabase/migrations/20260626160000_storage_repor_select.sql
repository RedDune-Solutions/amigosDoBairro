-- Repor a policy de SELECT (leitura) dos buckets públicos avatars/landing/menu.
-- PORQUÊ: o "no listing" anterior (20260625200000 + harden_rpc_grants) dropou os
-- *_public_read. Sem SELECT, o upload com `upsert: true` parte com HTTP 400
-- (o storage faz um select de existência no upsert) → avatar e fotos da landing
-- deixaram de poder ser carregados. Os buckets são PÚBLICOS (os ficheiros já são
-- servidos por URL público), por isso esta policy não expõe nada de novo — só
-- destranca o fluxo de upload. (Advisor 0025 "anon pode listar" reaparece, mas é
-- INFO e aceitável para buckets já públicos.)

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "landing_public_read" on storage.objects;
create policy "landing_public_read" on storage.objects
  for select using (bucket_id = 'landing');

drop policy if exists "menu_public_read" on storage.objects;
create policy "menu_public_read" on storage.objects
  for select using (bucket_id = 'menu');
