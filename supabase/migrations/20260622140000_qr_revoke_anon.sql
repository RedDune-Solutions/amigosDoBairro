-- Correctivo (advisor de segurança): as funções do QR herdaram default privileges
-- do Supabase (grant directo a anon/authenticated). 'revoke from public' não remove
-- esses grants directos, por isso anon conseguia executá-las (lint 0028).
-- Remove anon explicitamente; gen_nonce_code é interna (sem grant a ninguém).
-- Idempotente: numa instalação de raiz a migração anterior já deixa isto correcto.
revoke execute on function public.gen_nonce_code() from anon, authenticated, public;
revoke execute on function public.criar_nonce_earn() from anon, public;
revoke execute on function public.registar_compra_via_code(text, integer) from anon, public;
grant execute on function public.criar_nonce_earn() to authenticated;
grant execute on function public.registar_compra_via_code(text, integer) to authenticated;
