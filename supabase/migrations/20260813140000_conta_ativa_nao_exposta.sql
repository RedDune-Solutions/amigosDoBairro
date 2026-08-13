-- =============================================================================
-- conta_ativa() deixa de estar exposta como RPC (advisor 0029).
--
-- Na migration anterior a função levou `grant execute ... to authenticated`
-- porque os triggers corriam com os privilégios de quem faz o INSERT (o
-- cliente). Efeito colateral: ficou acessível em /rest/v1/rpc/conta_ativa, ou
-- seja qualquer sessão podia perguntar se uma conta estava suspensa. Devolve
-- só um booleano e exige saber o uuid (que o RLS de profiles não deixa
-- listar), por isso o impacto é residual — mas é uma porta desnecessária.
--
-- Fix: `bloquear_conta_suspensa()` passa a SECURITY DEFINER. Como pertence ao
-- postgres, que é dono de conta_ativa, o trigger deixa de precisar que o
-- utilizador tenha EXECUTE — e o grant pode ser revogado a toda a gente.
--
-- Seguro porque:
--   • conta_ativa é usada APENAS por esta função (verificado: nenhuma policy,
--     constraint ou outra função lhe toca);
--   • o corpo não faz SQL dinâmico nem escreve — só lê e levanta excepção,
--     com search_path fixo, por isso ser DEFINER não abre superfície nova;
--   • CREATE OR REPLACE mantém o oid, logo os 6 triggers continuam ligados
--     sem serem recriados, e os grants já revogados mantêm-se.
--
-- Ordem de deploy: independente do código. Não mexe em comportamento.
-- =============================================================================

create or replace function public.bloquear_conta_suspensa()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.conta_ativa(new.user_id) then
    raise exception 'Conta suspensa.';
  end if;
  return new;
end;
$$;

-- Fica só o dono (postgres), que é quem o trigger passa a encarnar.
revoke all on function public.conta_ativa(uuid) from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
