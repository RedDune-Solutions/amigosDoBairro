-- =============================================================================
-- Os Amigos do Bairro — esquema inicial (fidelização de café)
-- Princípio: pontos = dinheiro. O cliente NUNCA escreve no ledger directamente.
-- Todo o crédito/débito passa por funções SECURITY DEFINER com verificação de role.
-- =============================================================================

-- ---------- Tipos -----------------------------------------------------------
create type public.user_role as enum ('customer', 'staff', 'admin');

-- ---------- Tabela: profiles ------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text,
  telefone   text,
  role       public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'Perfil de utilizador. role só é alterável por admin (ver trigger).';

-- Cria automaticamente o profile quando nasce um auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, nome, telefone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'telefone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helpers de role (SECURITY DEFINER, evitam recursão de RLS) -------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Impede que um utilizador altere o seu próprio role (escalonamento de privilégios)
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Apenas um admin pode alterar o role.';
  end if;
  return new;
end;
$$;

create trigger profiles_no_self_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------- Tabela: points_ledger (append-only) -----------------------------
create table public.points_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  delta      integer not null check (delta <> 0),
  reason     text,
  source     text not null check (source in ('earn', 'redeem', 'adjust')),
  staff_id   uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);
comment on table public.points_ledger is 'Livro de movimentos de pontos. Append-only: sem UPDATE/DELETE. Saldo = SUM(delta).';

-- ---------- Tabela: rewards -------------------------------------------------
create table public.rewards (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  descricao    text,
  custo_pontos integer not null check (custo_pontos > 0),
  imagem       text,
  ativo        boolean not null default true,
  stock        integer check (stock is null or stock >= 0),
  created_at   timestamptz not null default now()
);

-- ---------- Tabela: redemptions ---------------------------------------------
create table public.redemptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  reward_id    uuid not null references public.rewards (id),
  custo_pontos integer not null,
  estado       text not null default 'pendente' check (estado in ('pendente', 'levantado', 'cancelado')),
  codigo       text not null,
  collected_by uuid references public.profiles (id),
  created_at   timestamptz not null default now()
);
create index redemptions_user_idx on public.redemptions (user_id, created_at desc);

-- ---------- Tabela: reservations --------------------------------------------
create table public.reservations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  data       date not null,
  hora       time not null,
  n_pessoas  integer not null check (n_pessoas between 1 and 20),
  estado     text not null default 'pendente' check (estado in ('pendente', 'confirmada', 'cancelada')),
  notas      text,
  created_at timestamptz not null default now()
);
create index reservations_data_idx on public.reservations (data, hora);

-- ---------- Tabela: earn_nonces (anti-replay do QR) -------------------------
create table public.earn_nonces (
  nonce      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- FUNÇÕES DE NEGÓCIO (SECURITY DEFINER) — única via de escrita no ledger
-- =============================================================================

-- Saldo do próprio utilizador
create or replace function public.meu_saldo()
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(delta), 0)::int
  from public.points_ledger
  where user_id = auth.uid();
$$;

-- Cliente gera um nonce de curta duração para o QR de acumulação
create or replace function public.criar_nonce_earn()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nonce uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.';
  end if;
  insert into public.earn_nonces (user_id, expires_at)
  values (auth.uid(), now() + interval '90 seconds')
  returning nonce into v_nonce;
  return v_nonce;
end;
$$;

-- Staff lê o QR (nonce) e credita pontos ao cliente. Bloqueia replay e auto-crédito.
create or replace function public.creditar_via_nonce(
  p_nonce  uuid,
  p_pontos integer,
  p_reason text default 'Compra em loja'
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.earn_nonces%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Apenas staff pode creditar pontos.';
  end if;
  if p_pontos is null or p_pontos <= 0 or p_pontos > 100 then
    raise exception 'Pontos inválidos (1..100).';
  end if;

  select * into v_row from public.earn_nonces
    where nonce = p_nonce
    for update;

  if not found then
    raise exception 'Código inválido.';
  end if;
  if v_row.used_at is not null then
    raise exception 'Código já utilizado.';
  end if;
  if v_row.expires_at < now() then
    raise exception 'Código expirado.';
  end if;

  update public.earn_nonces set used_at = now() where nonce = p_nonce;

  insert into public.points_ledger (user_id, delta, reason, source, staff_id)
  values (v_row.user_id, p_pontos, p_reason, 'earn', auth.uid());

  return p_pontos;
end;
$$;

-- Cliente resgata uma recompensa (transaccional, sem saldo negativo, sem corrida)
create or replace function public.resgatar_recompensa(p_reward uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_saldo  integer;
  v_codigo text;
begin
  if v_uid is null then
    raise exception 'Autenticação necessária.';
  end if;

  -- serializa resgates do mesmo utilizador (evita duplo gasto concorrente)
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select * into v_reward from public.rewards where id = p_reward for update;
  if not found or not v_reward.ativo then
    raise exception 'Recompensa indisponível.';
  end if;
  if v_reward.stock is not null and v_reward.stock <= 0 then
    raise exception 'Recompensa esgotada.';
  end if;

  select coalesce(sum(delta), 0)::int into v_saldo
    from public.points_ledger where user_id = v_uid;
  if v_saldo < v_reward.custo_pontos then
    raise exception 'Pontos insuficientes.';
  end if;

  insert into public.points_ledger (user_id, delta, reason, source)
  values (v_uid, -v_reward.custo_pontos, 'Resgate: ' || v_reward.titulo, 'redeem');

  if v_reward.stock is not null then
    update public.rewards set stock = stock - 1 where id = p_reward;
  end if;

  v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.redemptions (user_id, reward_id, custo_pontos, codigo)
  values (v_uid, p_reward, v_reward.custo_pontos, v_codigo);

  return v_codigo;
end;
$$;

-- Staff marca um resgate como levantado
create or replace function public.marcar_levantado(p_codigo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'Apenas staff.';
  end if;
  update public.redemptions
     set estado = 'levantado', collected_by = auth.uid()
   where codigo = p_codigo and estado = 'pendente';
  if not found then
    raise exception 'Código inválido ou já levantado.';
  end if;
end;
$$;

-- Admin ajusta pontos manualmente (correcções)
create or replace function public.ajustar_pontos(p_user uuid, p_delta integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas admin.';
  end if;
  if p_delta = 0 then
    raise exception 'Ajuste não pode ser zero.';
  end if;
  insert into public.points_ledger (user_id, delta, reason, source, staff_id)
  values (p_user, p_delta, coalesce(p_reason, 'Ajuste manual'), 'adjust', auth.uid());
end;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles       enable row level security;
alter table public.points_ledger  enable row level security;
alter table public.rewards        enable row level security;
alter table public.redemptions    enable row level security;
alter table public.reservations   enable row level security;
alter table public.earn_nonces    enable row level security;

-- profiles: vê o próprio; staff/admin vêem todos; actualiza só o próprio (role bloqueado por trigger)
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- points_ledger: leitura (próprio ou staff). SEM insert/update/delete directo (só via funções).
create policy ledger_select on public.points_ledger
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- rewards: todos os autenticados vêem activas; staff vê todas; gestão só admin
create policy rewards_select on public.rewards
  for select to authenticated using (ativo or public.is_staff());
create policy rewards_admin_write on public.rewards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- redemptions: cliente vê os seus; staff vê todos. Inserção só via função resgatar_recompensa.
create policy redemptions_select on public.redemptions
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- reservations: cliente CRUD próprio; staff vê/gere todas
create policy reservations_select on public.reservations
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
create policy reservations_insert on public.reservations
  for insert to authenticated with check (user_id = auth.uid() and data >= current_date);
create policy reservations_update_own on public.reservations
  for update to authenticated using (user_id = auth.uid() or public.is_staff());

-- earn_nonces: cliente vê/cria os seus (criação real é via função). Sem leitura cruzada.
create policy nonces_select_own on public.earn_nonces
  for select to authenticated using (user_id = auth.uid());

-- =============================================================================
-- GRANTS — funções de negócio executáveis por authenticated; bloqueio directo
-- =============================================================================
revoke all on function public.creditar_via_nonce(uuid, integer, text) from public;
revoke all on function public.resgatar_recompensa(uuid) from public;
revoke all on function public.marcar_levantado(text) from public;
revoke all on function public.ajustar_pontos(uuid, integer, text) from public;

grant execute on function public.meu_saldo() to authenticated;
grant execute on function public.criar_nonce_earn() to authenticated;
grant execute on function public.creditar_via_nonce(uuid, integer, text) to authenticated;
grant execute on function public.resgatar_recompensa(uuid) to authenticated;
grant execute on function public.marcar_levantado(text) to authenticated;
grant execute on function public.ajustar_pontos(uuid, integer, text) to authenticated;
