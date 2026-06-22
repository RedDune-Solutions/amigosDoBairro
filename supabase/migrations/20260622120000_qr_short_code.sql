-- =============================================================================
-- QR de acumulação com CÓDIGO CURTO numérico (scan + entrada manual no balcão).
-- O nonce continua a existir (PK uuid), mas o identificador que o cliente vê e
-- que o staff lê/escreve passa a ser um código de 6 DÍGITOS (teclado numérico,
-- fácil de inserir). Curta duração + unicidade entre activos evita colisões.
-- =============================================================================

alter table public.earn_nonces add column if not exists code text unique;

-- Gera um código de 6 dígitos único entre os nonces ainda válidos.
create or replace function public.gen_nonce_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
  ok     boolean;
begin
  loop
    v_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
    -- só colide com nonces ainda válidos (não usados e não expirados)
    select not exists (
      select 1 from public.earn_nonces
      where code = v_code and used_at is null and expires_at > now()
    ) into ok;
    exit when ok;
  end loop;
  return v_code;
end;
$$;

-- Recriar criar_nonce_earn a devolver o CÓDIGO (text) em vez do uuid.
-- (Mudança de tipo de retorno obriga a DROP antes de recriar.)
drop function if exists public.criar_nonce_earn();
create function public.criar_nonce_earn()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.';
  end if;
  v_code := public.gen_nonce_code();
  insert into public.earn_nonces (user_id, expires_at, code)
  values (auth.uid(), now() + interval '90 seconds', v_code);
  return v_code;
end;
$$;

-- Staff regista compra a partir do código curto (scan ou manual). Bloqueia
-- replay, auto-crédito e expirado; delega em registar_compra (pontos+carimbos).
create or replace function public.registar_compra_via_code(p_code text, p_euros integer)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.earn_nonces%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Apenas staff pode registar compras.';
  end if;

  select * into v_row from public.earn_nonces
    where code = btrim(p_code) for update;
  if not found then
    raise exception 'Código inválido.';
  end if;
  if v_row.used_at is not null then
    raise exception 'Código já utilizado.';
  end if;
  if v_row.expires_at < now() then
    raise exception 'Código expirado.';
  end if;

  update public.earn_nonces set used_at = now() where nonce = v_row.nonce;
  return public.registar_compra(v_row.user_id, p_euros);
end;
$$;

-- Grants: o Supabase tem default privileges que concedem EXECUTE directo a
-- anon/authenticated em funções novas — por isso é preciso revogar de `anon`
-- explicitamente (revoke from public não chega). gen_nonce_code é interna
-- (só chamada dentro de criar_nonce_earn, que corre como owner) → sem grants.
revoke execute on function public.gen_nonce_code() from anon, authenticated, public;
revoke execute on function public.criar_nonce_earn() from anon, public;
revoke execute on function public.registar_compra_via_code(text, integer) from anon, public;
grant execute on function public.criar_nonce_earn() to authenticated;
grant execute on function public.registar_compra_via_code(text, integer) to authenticated;
