-- Limite de reservas: passa de "3 ativas" para UMA por dia (por data).
-- O cliente vê todos os seus pedidos, mas não pode ter 2 reservas não-canceladas
-- para a mesma data. Mantém a binding do trigger existente (CREATE OR REPLACE).
create or replace function public.check_reservation_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.reservations
     where user_id = new.user_id
       and data = new.data
       and estado <> 'cancelada'
       and id <> new.id
  ) then
    raise exception 'Ja tens uma reserva para esse dia.';
  end if;
  return new;
end;
$$;
