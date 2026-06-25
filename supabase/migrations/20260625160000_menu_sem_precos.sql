-- Remover preços dos artigos do menu (decisão do café: menu sem preços).
alter table public.menu_items drop column if exists price;
