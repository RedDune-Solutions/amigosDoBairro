-- Consolidar policies permissivas duplicadas em SELECT (advisor 0006): as
-- policies admin "for all" cobriam SELECT em paralelo com a policy de leitura.
-- Passam a cobrir só escrita (insert/update/delete). is_admin em subselect.

-- prizes
drop policy if exists prizes_admin on public.prizes;
create policy prizes_admin_ins on public.prizes for insert to authenticated with check ((select public.is_admin()));
create policy prizes_admin_upd on public.prizes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy prizes_admin_del on public.prizes for delete to authenticated using ((select public.is_admin()));

-- rewards
drop policy if exists rewards_admin_write on public.rewards;
create policy rewards_admin_ins on public.rewards for insert to authenticated with check ((select public.is_admin()));
create policy rewards_admin_upd on public.rewards for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy rewards_admin_del on public.rewards for delete to authenticated using ((select public.is_admin()));

-- news
drop policy if exists news_admin on public.news;
create policy news_admin_ins on public.news for insert to authenticated with check ((select public.is_admin()));
create policy news_admin_upd on public.news for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy news_admin_del on public.news for delete to authenticated using ((select public.is_admin()));

-- loyalty_config: regras agora fixas no código → ninguém escreve. Remover a
-- policy admin (a leitura cfg_select using(true) chega).
drop policy if exists cfg_admin on public.loyalty_config;
