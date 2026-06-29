-- Registo: pré-verificar se o email já existe e se já está confirmado (ativo),
-- para a mensagem pós-registo dizer a VERDADE. O Supabase obfusca o signUp por
-- defesa contra enumeração: re-registar um email já confirmado devolve "sucesso"
-- sem erro e SEM enviar email — daí a app antiga dizer sempre "conta criada".
--
-- Mesma decisão de produto que o reset de password (ver pw_reset_request):
-- feedback explícito, com o risco de enumeração mitigado por rate-limit por IP.
-- SECURITY DEFINER e EXECUTÁVEL por `anon` PROPOSITADAMENTE (o ecrã de registo é
-- usado por quem NÃO está autenticado). Devolve só {rate_limited, exists, active},
-- nunca dados de utilizadores. (Advisor 0028 assinala anon→definer: intencional.)

create table if not exists public.signup_throttle (
  id         bigint generated always as identity primary key,
  ip         text not null,
  email      text,
  created_at timestamptz not null default now()
);
create index if not exists signup_throttle_ip_idx
  on public.signup_throttle (ip, created_at desc);

alter table public.signup_throttle enable row level security;
-- sem policies: só a função SECURITY DEFINER lê/escreve; clientes não acedem.

create or replace function public.signup_precheck(p_email text, p_ip text)
returns json
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_email  text := lower(trim(coalesce(p_email, '')));
  v_ip     text := coalesce(nullif(trim(p_ip), ''), 'desconhecido');
  v_limit  integer := 10;
  v_window interval := interval '15 minutes';
  v_count  integer;
  v_exists boolean := false;
  v_active boolean := false;
begin
  -- higiene: limpar registos antigos (mantém a tabela pequena)
  delete from public.signup_throttle where created_at < now() - interval '1 day';

  -- rate-limit por IP (janela deslizante)
  select count(*) into v_count
    from public.signup_throttle
   where ip = v_ip and created_at > now() - v_window;
  if v_count >= v_limit then
    return json_build_object('rate_limited', true);
  end if;

  insert into public.signup_throttle (ip, email) values (v_ip, v_email);

  -- exists = email em auth.users; active = email já confirmado.
  select true, (u.email_confirmed_at is not null)
    into v_exists, v_active
    from auth.users u
   where lower(u.email) = v_email
   limit 1;

  return json_build_object(
    'rate_limited', false,
    'exists', coalesce(v_exists, false),
    'active', coalesce(v_active, false)
  );
end;
$$;

revoke all on function public.signup_precheck(text, text) from public;
grant execute on function public.signup_precheck(text, text) to anon, authenticated;
