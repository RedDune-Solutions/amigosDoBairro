-- OAuth (Google): o trigger de criação de perfil passa a ler também o nome e a
-- foto que o provider fornece (`name`/`full_name`/`avatar_url`/`picture`), além
-- do nosso `nome`. Mantém a honra de convites de staff.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inv_role public.user_role;
begin
  insert into public.profiles (id, nome, telefone, avatar_url)
  values (
    new.id,
    nullif(coalesce(
      new.raw_user_meta_data ->> 'nome',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ), ''),
    nullif(new.raw_user_meta_data ->> 'telefone', ''),
    nullif(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ), '')
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
