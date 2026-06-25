-- =============================================================================
-- Reservas: arquivar (cliente), lembretes push (dia + 30 min antes), e endurecer
-- para o cliente NÃO poder mudar o estado (só staff aceita; cancelar = telefone).
-- =============================================================================

alter table public.reservations add column if not exists arquivada boolean not null default false;
alter table public.reservations add column if not exists lembrete_dia_at timestamptz;
alter table public.reservations add column if not exists lembrete_30_at  timestamptz;

-- Cliente só pode tocar em `arquivada` na sua reserva. Estado/data/hora/pessoas
-- só o staff. (O worker dos lembretes corre com service-role e só escreve nas
-- colunas lembrete_*, que não estão bloqueadas.)
create or replace function public.reservations_guard_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    if new.estado     is distinct from old.estado
       or new.data    is distinct from old.data
       or new.hora    is distinct from old.hora
       or new.n_pessoas is distinct from old.n_pessoas
       or new.user_id is distinct from old.user_id then
      raise exception 'forbidden';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_guard on public.reservations;
create trigger reservations_guard
  before update on public.reservations
  for each row execute function public.reservations_guard_update();
