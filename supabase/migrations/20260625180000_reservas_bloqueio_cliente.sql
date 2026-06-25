-- Admin pode bloquear SÓ as reservas de um cliente (no-show), sem suspender a conta.
alter table public.profiles add column if not exists reservas_bloqueadas boolean not null default false;

-- Admin liga/desliga o bloqueio (só clientes).
create or replace function public.definir_reservas_bloqueadas(p_user uuid, p_bloq boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select role into r from public.profiles where id = p_user;
  if r is distinct from 'customer' then raise exception 'so clientes'; end if;
  update public.profiles set reservas_bloqueadas = p_bloq where id = p_user;
end $$;
revoke all on function public.definir_reservas_bloqueadas(uuid, boolean) from public, anon;
grant execute on function public.definir_reservas_bloqueadas(uuid, boolean) to authenticated;

-- Defesa: impede o INSERT de reserva se o cliente estiver bloqueado.
create or replace function public.reservations_block_insert()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select reservas_bloqueadas from public.profiles where id = new.user_id) then
    raise exception 'reservas bloqueadas';
  end if;
  return new;
end $$;
drop trigger if exists reservations_block on public.reservations;
create trigger reservations_block before insert on public.reservations
  for each row execute function public.reservations_block_insert();
