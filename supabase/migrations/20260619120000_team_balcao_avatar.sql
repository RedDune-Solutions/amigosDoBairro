-- =============================================================================
-- Equipa (staff/admin), Balcão gamificado e foto de perfil.
-- =============================================================================

-- ---------- profiles: owner + avatar ----------------------------------------
alter table public.profiles add column if not exists is_owner boolean not null default false;
alter table public.profiles add column if not exists avatar_url text;

grant update (avatar_url) on public.profiles to authenticated;

-- ---------- gestão de roles (admin-only, owner protegido) -------------------
create or replace function public.definir_role(p_user uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_owner boolean;
  target_owner boolean;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores.';
  end if;
  if p_user = auth.uid() then
    raise exception 'Não podes alterar o teu próprio acesso.';
  end if;

  select is_owner into target_owner from public.profiles where id = p_user;
  if not found then
    raise exception 'Utilizador não encontrado.';
  end if;
  if target_owner then
    raise exception 'A conta principal não pode ser alterada.';
  end if;

  select is_owner into caller_owner from public.profiles where id = auth.uid();
  if p_role = 'admin' and not coalesce(caller_owner, false) then
    raise exception 'Só a conta principal pode criar administradores.';
  end if;

  update public.profiles set role = p_role where id = p_user;
end;
$$;

-- ---------- convites de staff (para quem ainda não tem conta) ---------------
create table if not exists public.staff_invites (
  email      text primary key,
  role       public.user_role not null default 'staff',
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
alter table public.staff_invites enable row level security;
create policy staff_invites_admin on public.staff_invites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, delete on public.staff_invites to authenticated;

-- handle_new_user passa a honrar convites pendentes
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inv_role public.user_role;
begin
  insert into public.profiles (id, nome, telefone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'telefone', '')
  )
  on conflict (id) do nothing;

  select role into inv_role from public.staff_invites where lower(email) = lower(new.email);
  if found then
    update public.profiles set role = inv_role where id = new.id;
    delete from public.staff_invites where lower(email) = lower(new.email);
  end if;

  return new;
end;
$$;

-- ---------- Balcão: registar compra a partir do QR (nonce) ------------------
create or replace function public.registar_compra_via_nonce(p_nonce uuid, p_euros integer)
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

  select * into v_row from public.earn_nonces where nonce = p_nonce for update;
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
  return public.registar_compra(v_row.user_id, p_euros);
end;
$$;

revoke all on function public.definir_role(uuid, public.user_role) from public;
revoke all on function public.registar_compra_via_nonce(uuid, integer) from public;
grant execute on function public.definir_role(uuid, public.user_role) to authenticated;
grant execute on function public.registar_compra_via_nonce(uuid, integer) to authenticated;

-- ---------- Storage: bucket de avatares -------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
