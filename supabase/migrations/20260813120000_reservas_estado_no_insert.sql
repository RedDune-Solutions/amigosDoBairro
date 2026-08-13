-- =============================================================================
-- Reservas: o cliente não pode escolher o `estado` ao criar a reserva.
--
-- Buraco fechado: a policy `reservations_insert` só validava `user_id` e
-- `data >= current_date`, e o GRANT de INSERT era da tabela inteira. Um cliente
-- autenticado, falando directamente com /rest/v1/reservations (anon key pública
-- + o JWT dele), podia inserir estado='confirmada' e auto-confirmar a reserva,
-- saltando a aprovação do balcão. O trigger `reservations_guard` já protegia o
-- estado, mas só em UPDATE — o INSERT ficou de fora.
--
-- ⚠️ ORDEM DENTRO DO FICHEIRO: o REVOKE ao nível da tabela TEM de vir ANTES dos
-- GRANTs por coluna. Revogar um privilégio de tabela revoga também os de coluna
-- (doc do REVOKE), por isso a ordem inversa apagaria os grants acabados de dar.
--
-- ⚠️ `estado` FICA no GRANT de UPDATE de propósito: o balcão confirma/recusa
-- reservas com a SESSÃO dele (src/lib/admin-actions.ts → createClient()), ou
-- seja com o mesmo role `authenticated` do cliente. Tirar `estado` do grant
-- partia o painel. Quem pode escrever `estado` continua a ser decidido pelo
-- trigger reservations_guard (is_staff()), não pelo grant.
--
-- Ordem de deploy: esta migration é retro-compatível com o código em produção
-- (nenhum caminho actual perde privilégios) — pode ser aplicada sozinha.
-- =============================================================================

-- ⚠️ ESTADO REAL DA BD (verificado em produção, 2026-08-13): além do
-- `grant select, insert, update` do init.sql, a tabela tem os DEFAULT PRIVILEGES
-- do Supabase (`grant all to anon, authenticated`) — INSERT e UPDATE em TODAS as
-- colunas, mais DELETE e TRUNCATE. Ninguém os revogou, ao contrário do que foi
-- feito para as tabelas de pontos em 20260623120000. Hoje só o RLS os segura
-- (não há policy de DELETE, por isso os apagamentos já morrem aí).
-- Por isso o REVOKE abaixo inclui delete/truncate: nenhum código apaga reservas
-- (o `on delete cascade` de profiles é executado pelo sistema, não pelo role do
-- utilizador, por isso não é afectado).
-- SELECT nunca é tocado (a app e o painel lêem reservas).
revoke insert, update, delete, truncate on public.reservations from authenticated, anon;

-- Colunas que o cliente escreve ao criar (src/lib/app-actions.ts:119 escreve
-- user_id/data/hora/n_pessoas; `notas` fica aberta para uso futuro).
-- `estado`, `arquivada` e `lembrete_*` ficam de fora: nascem dos defaults.
grant insert (user_id, data, hora, n_pessoas, notas)
  on public.reservations to authenticated;

-- `arquivada` = cliente arquiva a reserva recusada (app-actions.ts:82).
-- `estado`    = balcão confirma/recusa (admin-actions.ts:163), gated pelo trigger.
grant update (arquivada, estado)
  on public.reservations to authenticated;

-- Defesa em profundidade: mesmo que um grant volte a alargar, a policy recusa
-- qualquer estado que não seja 'pendente'. O ramo is_staff() deixa a porta
-- aberta a um futuro "reserva por telefone já confirmada" no painel.
alter policy reservations_insert on public.reservations
  with check (
    user_id = (select auth.uid())
    and data >= current_date
    and (estado = 'pendente' or (select public.is_staff()))
  );

-- O PostgREST cacheia privilégios/schema; sem isto continua a servir os antigos.
notify pgrst, 'reload schema';
