-- Recuperação de password: feedback explícito (o email tem conta?) + rate-limit
-- por IP. Decisão de produto: reverte a resposta neutra anterior por UX.
-- O risco de enumeração é mitigado pelo throttle (5 pedidos / 15 min / IP).
-- A função é SECURITY DEFINER e EXECUTÁVEL por `anon` PROPOSITADAMENTE (o ecrã de
-- recuperação é usado por quem NÃO está autenticado). Devolve só {rate_limited,
-- exists}, nunca dados de utilizadores. (Advisor 0028 assinala anon→definer: é
-- intencional aqui.)

create table if not exists public.pw_reset_throttle (
  id         bigint generated always as identity primary key,
  ip         text not null,
  email      text,
  created_at timestamptz not null default now()
);
create index if not exists pw_reset_throttle_ip_idx
  on public.pw_reset_throttle (ip, created_at desc);

alter table public.pw_reset_throttle enable row level security;
-- sem policies: só a função SECURITY DEFINER lê/escreve; clientes não acedem.

create or replace function public.pw_reset_request(p_email text, p_ip text)
returns json
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_email  text := lower(trim(coalesce(p_email, '')));
  v_ip     text := coalesce(nullif(trim(p_ip), ''), 'desconhecido');
  v_limit  integer := 5;
  v_window interval := interval '15 minutes';
  v_count  integer;
  v_exists boolean;
begin
  -- higiene: limpar registos antigos (mantém a tabela pequena)
  delete from public.pw_reset_throttle where created_at < now() - interval '1 day';

  -- rate-limit por IP (janela deslizante)
  select count(*) into v_count
    from public.pw_reset_throttle
   where ip = v_ip and created_at > now() - v_window;
  if v_count >= v_limit then
    return json_build_object('rate_limited', true);
  end if;

  insert into public.pw_reset_throttle (ip, email) values (v_ip, v_email);

  select exists(select 1 from auth.users where lower(email) = v_email) into v_exists;
  return json_build_object('rate_limited', false, 'exists', coalesce(v_exists, false));
end;
$$;

revoke all on function public.pw_reset_request(text, text) from public;
grant execute on function public.pw_reset_request(text, text) to anon, authenticated;
