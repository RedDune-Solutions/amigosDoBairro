-- =============================================================================
-- Restringe a leitura (SELECT) do bucket 'avatars' ao próprio dono, mantendo os
-- buckets de marketing ('menu', 'landing') com leitura pública.
--
-- PORQUÊ: a migração 20260626160000_storage_repor_select repôs um SELECT amplo
-- para 'avatars' (policy "avatars_public_read": `using (bucket_id = 'avatars')`,
-- sem role → aplica-se também a anon). Como os avatares vivem em
-- `{user_id}/{uuid}.ext`, isso permite ao anónimo LISTAR o bucket e enumerar
-- todas as pastas (= todos os UUIDs de utilizador) e descarregar todas as fotos
-- de perfil.
--
-- O bucket 'avatars' CONTINUA public:true — as imagens são servidas por path
-- exacto via /storage/v1/object/public/avatars/... (endpoint que NÃO passa pela
-- RLS), portanto os <img> da app não partem. O que esta policy corta é o
-- LIST/enumeração ANÓNIMA pela API (essa passa pela RLS): só o dono consegue
-- listar/ler a SUA pasta. O cleanup `.list(user.id)` do Profile continua a
-- funcionar (lista a própria pasta → (storage.foldername(name))[1] = auth.uid()).
--
-- 'menu' e 'landing' são imagens de marketing (a landing é vista por anónimos):
-- o LIST anónimo é inofensivo, por isso mantêm-se com leitura pública.
-- =============================================================================

-- ---------- Substituir as policies de SELECT desta cadeia --------------------
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "menu_public_read"    on storage.objects;
drop policy if exists "landing_public_read" on storage.objects;

-- Marketing (menu + landing): leitura pública mantida (LIST anónimo é inofensivo).
drop policy if exists "marketing_public_read" on storage.objects;
create policy "marketing_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('menu', 'landing'));

-- Avatars: leitura só do dono (mata a enumeração anónima das pastas/UUIDs).
drop policy if exists "avatars_select_own" on storage.objects;
create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
