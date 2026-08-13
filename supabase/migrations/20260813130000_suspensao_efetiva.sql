-- =============================================================================
-- Suspensão de conta (profiles.banned) passa a valer NA BASE DE DADOS.
--
-- Buraco fechado: `banned` só era lido em código (login e render de /app).
-- Como o PostgREST e o GoTrue são acessíveis directamente com a anon key
-- pública, um cliente suspenso pedia um token novo e continuava a ganhar
-- pontos, abrir raspadinhas e resgatar prémios sem passar pela app.
--
-- Estratégia: gate no FUNIL de valor (triggers BEFORE INSERT), em vez de
-- reescrever as RPC uma a uma. Motivos:
--   1. As RPC de crédito (registar_compra_v2, checkin_via_code_v2, ...) são
--      chamadas pelo BALCÃO — auth.uid() é o funcionário, não o beneficiário.
--      Um gate sobre auth.uid() nessas funções seria um no-op.
--   2. Reescrever corpos com CREATE OR REPLACE arrisca apagar lógica em silêncio.
-- Os triggers olham para `new.user_id` (o beneficiário real), cobrem todos os
-- caminhos de uma vez e não tocam em nenhuma função existente.
--
-- Só INSERT (ganhar/resgatar). UPDATEs ficam de fora de propósito: levantar um
-- prémio JÁ ganho (usar_carteira / marcar_levantado) continua a funcionar —
-- é decisão de produto, não de segurança, e evita confundir o balcão.
--
-- Ordem de deploy: aplicável antes ou depois do código. As mensagens de erro
-- amigáveis vêm no deploy do código; sem ele o cliente suspenso vê o erro
-- genérico da app (não parte nada).
-- =============================================================================

-- Fail-closed: sem linha em profiles → false (nega). Ao contrário de um IF sobre
-- NULL, que passaria. SECURITY DEFINER porque é chamada de dentro de triggers e
-- policies, onde o caller não tem necessariamente SELECT em profiles.
create or replace function public.conta_ativa(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where id = p_user and not banned
  );
$$;

revoke all on function public.conta_ativa(uuid) from public, anon;
grant execute on function public.conta_ativa(uuid) to authenticated, service_role;

-- Trigger partilhado: recusa qualquer linha de valor destinada a conta suspensa.
create or replace function public.bloquear_conta_suspensa()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.conta_ativa(new.user_id) then
    raise exception 'Conta suspensa.';
  end if;
  return new;
end;
$$;

revoke all on function public.bloquear_conta_suspensa() from public, anon, authenticated;

-- points_lots  = funil de TODOS os pontos (_criar_lote passa por aqui).
-- stamp_events = carimbos (não passam por _criar_lote).
-- scratch_cards / wallet_items = raspadinhas e prémios ganhos.
-- redemptions  = trocar pontos por recompensa.
drop trigger if exists points_lots_conta_ativa on public.points_lots;
create trigger points_lots_conta_ativa
  before insert on public.points_lots
  for each row execute function public.bloquear_conta_suspensa();

drop trigger if exists stamp_events_conta_ativa on public.stamp_events;
create trigger stamp_events_conta_ativa
  before insert on public.stamp_events
  for each row execute function public.bloquear_conta_suspensa();

drop trigger if exists scratch_cards_conta_ativa on public.scratch_cards;
create trigger scratch_cards_conta_ativa
  before insert on public.scratch_cards
  for each row execute function public.bloquear_conta_suspensa();

drop trigger if exists wallet_items_conta_ativa on public.wallet_items;
create trigger wallet_items_conta_ativa
  before insert on public.wallet_items
  for each row execute function public.bloquear_conta_suspensa();

drop trigger if exists redemptions_conta_ativa on public.redemptions;
create trigger redemptions_conta_ativa
  before insert on public.redemptions
  for each row execute function public.bloquear_conta_suspensa();

-- Reservas: conta suspensa também não marca mesa. Feito por trigger e não na
-- policy de propósito — uma recusa por RLS chega à app como "violates row-level
-- security policy" e o cliente via "Não foi possível reservar."; o trigger
-- devolve 'Conta suspensa.', que a app mapeia para uma mensagem que se percebe.
drop trigger if exists reservations_conta_ativa on public.reservations;
create trigger reservations_conta_ativa
  before insert on public.reservations
  for each row execute function public.bloquear_conta_suspensa();

notify pgrst, 'reload schema';
