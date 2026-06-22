-- Hardening (defesa em profundidade), sugerido pelos advisors do Supabase:
--   1. Nenhuma função SECURITY DEFINER deve ser executável por `anon`/`public`.
--      As funções já se auto-protegem (is_staff/is_admin/auth.uid), mas retira-se
--      o EXECUTE implícito a quem não está autenticado para reduzir superfície.
--   2. Bucket público `avatars` não precisa de policy de SELECT em storage.objects
--      (os URLs públicos servem na mesma); remover impede listar ficheiros alheios.

-- 1. Revogar EXECUTE a anon + public em todas as funções do schema public,
--    e regrant explícito às que a app chama como `authenticated`.
revoke execute on all functions in schema public from anon, public;

grant execute on function public.is_staff() to authenticated;            -- usado pelas policies RLS
grant execute on function public.is_admin() to authenticated;            -- usado pelas policies RLS
grant execute on function public.meu_saldo() to authenticated;
grant execute on function public.criar_nonce_earn() to authenticated;
grant execute on function public.creditar_via_nonce(uuid, integer, text) to authenticated;
grant execute on function public.resgatar_recompensa(uuid) to authenticated;
grant execute on function public.marcar_levantado(text) to authenticated;
grant execute on function public.ajustar_pontos(uuid, integer, text) to authenticated;
grant execute on function public.registar_compra(uuid, integer) to authenticated;
grant execute on function public.abrir_raspadinha(uuid) to authenticated;
grant execute on function public.usar_carteira(text) to authenticated;
grant execute on function public.definir_role(uuid, public.user_role) to authenticated;
grant execute on function public.registar_compra_via_nonce(uuid, integer) to authenticated;
-- handle_new_user() e prevent_role_change() ficam sem EXECUTE: são funções de
-- trigger (correm no contexto do trigger, não precisam de grant a nenhum role).

-- 2. Remover a policy de leitura ampla no bucket público de avatares.
drop policy if exists "avatars_public_read" on storage.objects;
