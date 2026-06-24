-- =============================================================================
-- Menu editável (visível aos clientes, CRUD pela admin) + preferências de comida
-- do cliente (dropdown editável) + base para gráfico de preferências.
-- Convenções: secure-by-default → RLS + GRANT explícito (ver init.sql).
-- =============================================================================

-- ---------- Menu: categorias + itens ----------------------------------------
create table public.menu_categories (
  id         uuid primary key default gen_random_uuid(),
  label_pt   text not null,
  label_en   text,
  icon       text not null default 'coffee',
  accent     text not null default 'primary',
  ordem      integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  name_pt     text not null,
  name_en     text,
  desc_pt     text,
  desc_en     text,
  price       text not null default '',
  ordem       integer not null default 0,
  created_at  timestamptz not null default now()
);
create index menu_items_cat_idx on public.menu_items (category_id, ordem);

-- ---------- Preferências de comida ------------------------------------------
-- Opções do dropdown (editáveis pela admin). O valor escolhido fica em profiles.food_pref (slug).
create table public.food_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  label_pt   text not null,
  label_en   text,
  ordem      integer not null default 0,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles add column food_pref text;
comment on column public.profiles.food_pref is 'Slug da comida preferida (food_categories.slug). Escolhido no registo.';

-- ---------- RLS --------------------------------------------------------------
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.food_categories enable row level security;

-- Menu e opções: leitura pública (clientes vêem o menu); gestão só admin.
create policy menu_cat_read  on public.menu_categories for select to anon, authenticated using (true);
create policy menu_cat_admin on public.menu_categories for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy menu_item_read  on public.menu_items for select to anon, authenticated using (true);
create policy menu_item_admin on public.menu_items for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy food_read  on public.food_categories for select to anon, authenticated using (true);
create policy food_admin on public.food_categories for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- GRANTS -----------------------------------------------------------
grant select on public.menu_categories to anon, authenticated;
grant insert, update, delete on public.menu_categories to authenticated;
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant select on public.food_categories to anon, authenticated;
grant insert, update, delete on public.food_categories to authenticated;

-- Cliente grava a sua própria preferência (RLS profiles_update_own já garante id = auth.uid()).
grant update (food_pref) on public.profiles to authenticated;

-- ---------- Trigger: copiar food_pref do metadata no signup ------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, nome, telefone, food_pref)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'telefone', ''),
    nullif(new.raw_user_meta_data ->> 'food_pref', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------- Seed: opções de comida ------------------------------------------
insert into public.food_categories (slug, label_pt, label_en, ordem) values
  ('doces',     'Doces',     'Sweets',  1),
  ('salgados',  'Salgados',  'Savoury', 2),
  ('brunch',    'Brunch',    'Brunch',  3),
  ('refeicoes', 'Refeições', 'Meals',   4),
  ('lanches',   'Lanches',   'Snacks',  5);

-- ---------- Seed: menu inicial (espelha o MENU estático do design) ----------
do $$
declare
  c_cafe uuid; c_sandes uuid; c_doces uuid; c_pratos uuid;
begin
  insert into public.menu_categories (label_pt, label_en, accent, icon, ordem)
    values ('Cafés & Bebidas', 'Coffees & Drinks', 'primary', 'coffee', 1) returning id into c_cafe;
  insert into public.menu_categories (label_pt, label_en, accent, icon, ordem)
    values ('Sandes & Tostas', 'Sandwiches & Toasties', 'blue', 'sandwich', 2) returning id into c_sandes;
  insert into public.menu_categories (label_pt, label_en, accent, icon, ordem)
    values ('Doces & Pastelaria', 'Sweets & Pastries', 'red', 'cake', 3) returning id into c_doces;
  insert into public.menu_categories (label_pt, label_en, accent, icon, ordem)
    values ('Pratos do Dia', 'Dishes of the Day', 'green', 'plate', 4) returning id into c_pratos;

  insert into public.menu_items (category_id, name_pt, name_en, desc_pt, desc_en, price, ordem) values
    (c_cafe, 'Café (bica)', 'Espresso', 'Torra clássica da casa', 'House classic roast', '0,80', 1),
    (c_cafe, 'Galão', 'Latte', 'Leite cremoso, café suave', 'Creamy milk, mild coffee', '1,40', 2),
    (c_cafe, 'Cappuccino', 'Cappuccino', 'Espuma de leite e canela', 'Milk foam and cinnamon', '1,80', 3),
    (c_cafe, 'Chá da casa', 'House tea', 'Selecção de infusões', 'Selection of infusions', '1,30', 4),
    (c_sandes, 'Tosta mista', 'Ham & cheese toastie', 'Fiambre e queijo no pão caseiro', 'Ham and cheese on homemade bread', '2,50', 1),
    (c_sandes, 'Sandes de frango', 'Chicken sandwich', 'Frango desfiado e maionese', 'Pulled chicken and mayo', '3,20', 2),
    (c_sandes, 'Bifana no pão', 'Pork cutlet roll', 'Lombo temperado à moda do bairro', 'Seasoned pork, neighbourhood style', '2,80', 3),
    (c_doces, 'Pastel de nata', 'Custard tart', 'Acabado de sair do forno', 'Fresh out of the oven', '1,20', 1),
    (c_doces, 'Bolo do dia', 'Cake of the day', 'Pergunte ao balcão', 'Ask at the counter', '2,20', 2),
    (c_doces, 'Croissant', 'Croissant', 'Simples ou com doce', 'Plain or with jam', '1,40', 3),
    (c_pratos, 'Sopa + Prato', 'Soup + Main', 'Menu de almoço completo', 'Full lunch menu', '7,50', 1),
    (c_pratos, 'Salada da horta', 'Garden salad', 'Legumes frescos do mercado', 'Fresh vegetables from the market', '5,90', 2);
end $$;
