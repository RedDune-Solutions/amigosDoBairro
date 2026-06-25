-- =============================================================================
-- Guardar subscrição push de forma robusta.
-- Bug: `push_subscriptions` não tinha policy de UPDATE → o upsert por
-- `onConflict:endpoint` falhava (RLS nega o UPDATE) sempre que o mesmo
-- dispositivo voltava a subscrever → "Não foi possível ativar".
-- Fix: RPC SECURITY DEFINER que faz delete-by-endpoint + insert com o auth.uid()
-- corrente. Trata: 1ª subscrição, re-subscrição do mesmo device, e device que
-- passa a outro utilizador (o endpoint é reatribuído).
-- =============================================================================

create or replace function public.guardar_push_sub(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'sem sessão';
  end if;
  if p_endpoint is null or length(p_endpoint) < 10 or p_p256dh is null or p_auth is null then
    raise exception 'subscrição inválida';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (uid, p_endpoint, p_p256dh, p_auth);
end;
$$;

revoke all on function public.guardar_push_sub(text, text, text) from public, anon;
grant execute on function public.guardar_push_sub(text, text, text) to authenticated;
