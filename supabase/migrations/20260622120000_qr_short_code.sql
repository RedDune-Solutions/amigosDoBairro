-- =============================================================================
-- QR de acumulação com CÓDIGO CURTO legível (scan + entrada manual no balcão).
-- O nonce continua a existir (PK uuid), mas o identificador que o cliente vê e
-- que o staff lê/escreve passa a ser um código curto de 8 chars sem ambíguos.
-- =============================================================================

alter table public.earn_nonces add column if not exists code text unique;

-- Gera um código curto único (alfabeto sem 0/O/1/I/L para evitar erros à mão).
create or replace function public.gen_nonce_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code   text;
  i        integer;
  ok       boolean;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
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
    where code = upper(btrim(p_code)) for update;
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

-- Grants: estas funções correm como `authenticated` (auto-protegem-se por role).
-- criar_nonce_earn foi DROP+CREATE → os privilégios são repostos (default = PUBLIC),
-- por isso revoga-se PUBLIC e regrant-se só a authenticated (paridade com o hardening).
revoke all on function public.gen_nonce_code() from public;
revoke all on function public.criar_nonce_earn() from public;
revoke all on function public.registar_compra_via_code(text, integer) from public;
grant execute on function public.criar_nonce_earn() to authenticated;
grant execute on function public.registar_compra_via_code(text, integer) to authenticated;
