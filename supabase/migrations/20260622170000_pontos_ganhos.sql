-- Total de pontos GANHOS (lifetime) do próprio utilizador — soma só os movimentos
-- positivos do ledger (compras + cupões/ajustes positivos). Usado para os níveis
-- (badges), que sobem com o gasto acumulado e nunca descem ao resgatar.
create or replace function public.meus_pontos_ganhos()
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(delta), 0)::int
  from public.points_ledger
  where user_id = auth.uid() and delta > 0;
$$;

revoke all on function public.meus_pontos_ganhos() from public, anon;
grant execute on function public.meus_pontos_ganhos() to authenticated;
