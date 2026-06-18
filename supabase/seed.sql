-- Seed de demonstração — VALORES PLACEHOLDER (confirmar com a Daniela).
-- Corre em `supabase db reset`.

insert into public.rewards (titulo, descricao, custo_pontos, ativo, stock) values
  ('Café grátis',          'Um café (expresso) por conta da casa.',            10, true, null),
  ('Tosta mista',          'Tosta mista quentinha.',                           25, true, null),
  ('Fatia de bolo',        'Fatia de bolo do dia.',                            20, true, null),
  ('Sumo natural',         'Sumo de laranja natural.',                         18, true, null),
  ('Menu pequeno-almoço',  'Café + torrada + sumo.',                           40, true, 50),
  ('Caneca Amigos do Bairro', 'Caneca de edição limitada do clube.',           80, true, 30);

-- NOTA: para criar staff/admin localmente, regista o utilizador na app e depois:
--   update public.profiles set role = 'admin' where id = '<uuid>';
-- (ou usa o Studio local em http://localhost:54323)
