-- =============================================================================
-- Expansão gamificada: carimbos, raspadinhas, prémios, carteira, escalões.
-- Tudo server-authoritative: o cliente nunca decide pontos, carimbos nem prémios.
-- =============================================================================

-- ---------- profiles: carimbos + progresso de gasto -------------------------
alter table public.profiles add column if not exists stamps integer not null default 0;
alter table public.profiles add column if not exists spend_toward integer not null default 0;

-- ---------- config de fidelidade (singleton) --------------------------------
create table public.loyalty_config (
  id              boolean primary key default true check (id),
  euro_per_stamp  integer not null default 15 check (euro_per_stamp > 0),
  stamp_goal      integer not null default 10 check (stamp_goal > 0)
);
insert into public.loyalty_config (id) values (true) on conflict do nothing;

-- ---------- rewards: alinhar com o design (ícone, cor, bilingue) ------------
alter table public.rewards add column if not exists icon text;
alter table public.rewards add column if not exists accent text;        -- primary|blue|green|red
alter table public.rewards add column if not exists nome_en text;
alter table public.rewards add column if not exists desc_en text;
alter table public.rewards add column if not exists ordem integer not null default 0;

-- ---------- prémios das raspadinhas (pools comum / especial) ----------------
create table public.prizes (
  id        text primary key,
  kind      text not null check (kind in ('comum', 'especial')),
  nome_pt   text not null,
  nome_en   text,
  desc_pt   text,
  desc_en   text,
  icon      text not null,
  accent    text not null,
  weight    integer not null check (weight > 0),
  stock     integer not null check (stock >= 0),
  ativo     boolean not null default true
);

-- ---------- raspadinhas do cliente (por abrir / abertas) --------------------
create table public.scratch_cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('comum', 'especial')),
  status     text not null default 'por-abrir' check (status in ('por-abrir', 'aberta')),
  prize_id   text references public.prizes (id),
  created_at timestamptz not null default now()
);
create index scratch_user_idx on public.scratch_cards (user_id, status);

-- ---------- carteira (prémios ganhos nas raspadinhas) -----------------------
create table public.wallet_items (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  prize_id  text references public.prizes (id),
  kind      text not null,
  nome_pt   text not null,
  nome_en   text,
  desc_pt   text,
  desc_en   text,
  icon      text,
  accent    text,
  codigo    text not null,
  status    text not null default 'por-usar' check (status in ('por-usar', 'usado')),
  collected_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index wallet_user_idx on public.wallet_items (user_id, created_at desc);

-- =============================================================================
-- FUNÇÕES (SECURITY DEFINER)
-- =============================================================================

-- Registar compra (STAFF): credita pontos = €, soma carimbos a cada euro_per_stamp,
-- e a cada stamp_goal carimbos gera 1 raspadinha especial + 1 comum.
create or replace function public.registar_compra(p_user uuid, p_euros integer)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cfg        public.loyalty_config%rowtype;
  v_stamps   integer;
  v_spend    integer;
  total_spend integer;
  new_stamps integer;
  total_stamps integer;
  cartolas   integer;
  rem_stamps integer;
  i          integer;
begin
  if not public.is_staff() then
    raise exception 'Apenas staff pode registar compras.';
  end if;
  if p_euros is null or p_euros <= 0 or p_euros > 1000 then
    raise exception 'Valor inválido.';
  end if;

  select * into cfg from public.loyalty_config where id;
  select stamps, spend_toward into v_stamps, v_spend from public.profiles where id = p_user for update;
  if not found then
    raise exception 'Cliente não encontrado.';
  end if;

  -- pontos = euros gastos
  insert into public.points_ledger (user_id, delta, reason, source, staff_id)
  values (p_user, p_euros, 'Compra em loja', 'earn', auth.uid());

  -- carimbos
  total_spend := v_spend + p_euros;
  new_stamps := total_spend / cfg.euro_per_stamp;
  v_spend := total_spend % cfg.euro_per_stamp;
  total_stamps := v_stamps + new_stamps;
  cartolas := total_stamps / cfg.stamp_goal;
  rem_stamps := total_stamps % cfg.stamp_goal;

  update public.profiles set stamps = rem_stamps, spend_toward = v_spend where id = p_user;

  -- raspadinhas (1 especial + 1 comum por cartola completa)
  if cartolas > 0 then
    for i in 1..cartolas loop
      insert into public.scratch_cards (user_id, kind) values (p_user, 'especial');
      insert into public.scratch_cards (user_id, kind) values (p_user, 'comum');
    end loop;
  end if;

  return json_build_object('pontos', p_euros, 'novos_carimbos', new_stamps, 'cartolas', cartolas);
end;
$$;

-- Abrir raspadinha (CLIENTE): o servidor sorteia o prémio (ponderado + stock).
-- O cliente nunca escolhe — só vê a animação. Devolve o prémio ganho.
create or replace function public.abrir_raspadinha(p_card uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  card    public.scratch_cards%rowtype;
  total_w integer;
  pick    integer;
  acc     integer := 0;
  pr      public.prizes%rowtype;
  v_code  text;
begin
  if v_uid is null then
    raise exception 'Autenticação necessária.';
  end if;

  select * into card from public.scratch_cards where id = p_card and user_id = v_uid for update;
  if not found then
    raise exception 'Raspadinha inválida.';
  end if;
  if card.status = 'aberta' then
    raise exception 'Raspadinha já aberta.';
  end if;

  -- sorteio ponderado sobre os prémios com stock do tipo certo
  select coalesce(sum(weight), 0) into total_w
    from public.prizes where kind = card.kind and ativo and stock > 0;
  if total_w = 0 then
    raise exception 'Sem prémios em stock.';
  end if;
  pick := floor(random() * total_w);
  for pr in select * from public.prizes where kind = card.kind and ativo and stock > 0 order by id loop
    acc := acc + pr.weight;
    if pick < acc then exit; end if;
  end loop;

  -- consome stock + marca raspadinha aberta + adiciona à carteira
  update public.prizes set stock = stock - 1 where id = pr.id;
  update public.scratch_cards set status = 'aberta', prize_id = pr.id where id = p_card;

  v_code := 'AB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  insert into public.wallet_items (user_id, prize_id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, codigo)
  values (v_uid, pr.id, pr.kind, pr.nome_pt, pr.nome_en, pr.desc_pt, pr.desc_en, pr.icon, pr.accent, v_code);

  return json_build_object('prize_id', pr.id, 'nome_pt', pr.nome_pt, 'nome_en', pr.nome_en,
    'desc_pt', pr.desc_pt, 'desc_en', pr.desc_en, 'icon', pr.icon, 'accent', pr.accent, 'codigo', v_code);
end;
$$;

-- Staff valida um item da carteira (levantamento)
create or replace function public.usar_carteira(p_codigo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'Apenas staff.';
  end if;
  update public.wallet_items
     set status = 'usado', collected_by = auth.uid()
   where codigo = p_codigo and status = 'por-usar';
  if not found then
    raise exception 'Código inválido ou já usado.';
  end if;
end;
$$;

-- =============================================================================
-- RLS + GRANTS
-- =============================================================================
alter table public.loyalty_config enable row level security;
alter table public.prizes         enable row level security;
alter table public.scratch_cards  enable row level security;
alter table public.wallet_items   enable row level security;

-- loyalty_config: todos lêem; só admin escreve
create policy cfg_select on public.loyalty_config for select to authenticated using (true);
create policy cfg_admin on public.loyalty_config for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- prizes: todos lêem activos / staff vê todos; admin gere
create policy prizes_select on public.prizes for select to authenticated using (ativo or public.is_staff());
create policy prizes_admin on public.prizes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- scratch_cards: cliente vê as suas (abertura via função); staff vê todas
create policy scratch_select on public.scratch_cards for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- wallet_items: cliente vê os seus; staff vê todos
create policy wallet_select on public.wallet_items for select to authenticated using (user_id = auth.uid() or public.is_staff());

grant select on public.loyalty_config to authenticated;
grant select on public.prizes to authenticated;
grant select, insert, update, delete on public.prizes to authenticated;  -- gestão admin via RLS
grant select on public.scratch_cards to authenticated;
grant select on public.wallet_items to authenticated;

revoke all on function public.registar_compra(uuid, integer) from public;
revoke all on function public.usar_carteira(text) from public;
grant execute on function public.registar_compra(uuid, integer) to authenticated;
grant execute on function public.abrir_raspadinha(uuid) to authenticated;
grant execute on function public.usar_carteira(text) to authenticated;
