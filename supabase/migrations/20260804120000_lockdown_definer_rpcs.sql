-- Lockdown de RPCs SECURITY DEFINER expostos sem necessidade
-- (Security Advisor lints 0028/0029).
--
-- signup_precheck / pw_reset_request: tinham EXECUTE para anon/authenticated,
-- mas o p_ip é um parâmetro do caller — chamados diretamente via /rest/v1/rpc
-- com IP forjado, o throttle era contornável e o `exists` devolvido virava um
-- oráculo de enumeração de emails sem limite. Passam a ser chamados apenas pelo
-- servidor (service role, src/lib/auth-actions.ts), que determina o IP real
-- (src/lib/request-ip.ts).
--
-- ⚠️ ORDEM EM PRODUÇÃO: aplicar só DEPOIS do deploy do código que chama estes
-- RPCs com service role — senão o registo/recuperação de password partem.
revoke execute on function public.signup_precheck(text, text) from anon, authenticated;
revoke execute on function public.pw_reset_request(text, text) from anon, authenticated;

-- Trigger functions: nunca são chamáveis via RPC (o Postgres recusa invocar
-- funções `returns trigger` diretamente), mas os grants a clientes geram
-- warnings no advisor. Revogar é inócuo — a execução via trigger não verifica
-- o EXECUTE do utilizador que dispara o statement.
revoke execute on function public.check_reservation_limit() from public, anon, authenticated;
revoke execute on function public.reservations_block_insert() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.prevent_role_change() from authenticated;
