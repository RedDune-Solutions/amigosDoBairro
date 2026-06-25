-- =============================================================================
-- Endurecimento dos buckets públicos 'menu' e 'landing' (lint 0025:
-- "Public Bucket Allows Listing").
--
-- Uma policy de SELECT ampla em storage.objects permite ao cliente LISTAR todos
-- os ficheiros do bucket. Buckets públicos NÃO precisam dela para servir os
-- objectos pelo URL directo (/storage/v1/object/public/...), por isso removê-la
-- elimina a listagem sem afectar a visualização das imagens.
--
-- O código só usa upload() + getPublicUrl() (nunca list()), pelo que é seguro.
-- A escrita continua restrita a admin (policies *_admin_insert/update/delete).
-- =============================================================================

drop policy if exists "menu_public_read"    on storage.objects;
drop policy if exists "landing_public_read" on storage.objects;
