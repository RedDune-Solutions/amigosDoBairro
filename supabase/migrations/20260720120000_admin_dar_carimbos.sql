-- =============================================================================
-- Oferta manual do admin a um cliente (gestão de clientes): carimbos e/ou
-- raspadinhas (comum/especial) numa só operação atómica.
-- Server-authoritative, igual ao resto do sistema "carimbos = dinheiro":
--   · gate is_admin() · só sobre contas 'customer' · row lock no perfil
--   · carimbos: rollover idêntico à compra — a cada 10 → 1 comum + 1 especial
--   · carimbos manuais NÃO contam para o teto de 2/semana (stamp_events) —
--     é uma oferta do admin, não um carimbo de compra ≥15€.
--   · raspadinhas diretas: inserem em scratch_cards (saem por probabilidade,
--     como as restantes — o sorteio continua server-side em abrir_raspadinha).
-- Avisa o cliente in-app (a app mostra cartão/raspadinhas na próxima abertura).
-- =============================================================================

drop function if exists public.admin_dar_carimbos(uuid, integer);

create or replace function public.admin_dar_oferta(
  p_user uuid, p_carimbos integer, p_comum integer, p_especial integer
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r        text;
  cur      integer;
  newc     integer;
  cartolas integer := 0;
  i        integer;
  partes   text[] := '{}';
  corpo_pt text;
  corpo_en text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if coalesce(p_carimbos, 0) not between 0 and 10
     or coalesce(p_comum, 0) not between 0 and 10
     or coalesce(p_especial, 0) not between 0 and 10 then
    raise exception 'valor invalido';
  end if;
  if coalesce(p_carimbos, 0) + coalesce(p_comum, 0) + coalesce(p_especial, 0) = 0 then
    raise exception 'oferta vazia';
  end if;

  -- Bloqueia o perfil primeiro → serializa a lógica de carimbos por utilizador
  -- (evita duplicar raspadinhas com pedidos concorrentes).
  select role, stamps into r, cur from public.profiles where id = p_user for update;
  if not found then
    raise exception 'cliente inexistente';
  end if;
  if r is distinct from 'customer' then
    raise exception 'so clientes';
  end if;

  -- Carimbos: rollover igual à compra — cartão completo (>=10) reinicia e gera
  -- 1 raspadinha comum + 1 especial. Loop cobre ofertas que atravessam >1 cartão.
  if coalesce(p_carimbos, 0) > 0 then
    newc := coalesce(cur, 0) + p_carimbos;
    while newc >= 10 loop
      newc := newc - 10;
      cartolas := cartolas + 1;
      insert into public.scratch_cards (user_id, kind) values (p_user, 'comum');
      insert into public.scratch_cards (user_id, kind) values (p_user, 'especial');
    end loop;
    update public.profiles set stamps = newc where id = p_user;
    partes := partes || (p_carimbos || ' carimbo(s)');
  end if;

  -- Raspadinhas diretas (oferta), por tipo.
  if coalesce(p_comum, 0) > 0 then
    for i in 1..p_comum loop
      insert into public.scratch_cards (user_id, kind) values (p_user, 'comum');
    end loop;
    partes := partes || (p_comum || ' raspadinha(s)');
  end if;
  if coalesce(p_especial, 0) > 0 then
    for i in 1..p_especial loop
      insert into public.scratch_cards (user_id, kind) values (p_user, 'especial');
    end loop;
    partes := partes || (p_especial || ' raspadinha(s) especial(is)');
  end if;

  corpo_pt := array_to_string(partes, ' · ');
  corpo_en := corpo_pt;  -- números + nomes quase iguais; EN fino não justifica duplicar
  if cartolas > 0 then
    corpo_pt := corpo_pt || ' · cartão completo: +' || (cartolas * 2) || ' raspadinhas!';
    corpo_en := corpo_en || ' · full card: +' || (cartolas * 2) || ' scratch cards!';
  end if;

  -- Aviso in-app ao cliente (best-effort de UX; a fonte da verdade são as tabelas).
  insert into public.notifications (user_id, kind, title_pt, title_en, body_pt, body_en, icon, accent)
  values (p_user, 'premio', 'Recebeste uma oferta', 'You got a gift', corpo_pt, corpo_en, 'ticket', 'primary');

  return json_build_object(
    'stamps', coalesce(newc, cur, 0),
    'carimbos', coalesce(p_carimbos, 0),
    'comum', coalesce(p_comum, 0),
    'especial', coalesce(p_especial, 0),
    'cartolas', cartolas
  );
end;
$$;

revoke all on function public.admin_dar_oferta(uuid, integer, integer, integer) from public, anon;
grant execute on function public.admin_dar_oferta(uuid, integer, integer, integer) to authenticated;
