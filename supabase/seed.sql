-- Seed alinhado com o design (app-data.jsx). Valores a confirmar com a Daniela.

-- Recompensas (troca de pontos)
insert into public.rewards (titulo, nome_en, descricao, desc_en, custo_pontos, icon, accent, ativo, ordem) values
  ('Café grátis',     'Free coffee',     'Bica ou meia de leite',        'Espresso or flat white',     50,  'coffee',   'primary', true, 1),
  ('Sumo natural',    'Fresh juice',     'Laranja espremida na hora',    'Freshly squeezed orange',    90,  'plate',    'green',   true, 2),
  ('Bolo do dia',     'Cake of the day', 'Fatia generosa à escolha',     'A generous slice',           120, 'cake',     'red',     true, 3),
  ('Tosta mista',     'Ham & cheese toastie', 'O clássico da casa',      'The house classic',          150, 'sandwich', 'blue',    true, 4),
  ('-20% no almoço',  '-20% off lunch',  'Menu Prato do Dia',            'Dish of the Day menu',       200, 'tag',      'green',   true, 5),
  ('Caneca exclusiva','Exclusive mug',   'Edição "Amigos do Bairro"',    '"Amigos do Bairro" edition', 350, 'gift',     'primary', true, 6);

-- Prémios das raspadinhas — COMUM
insert into public.prizes (id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, weight, stock) values
  ('c_cafe',  'comum', 'Café grátis',   'Free coffee',     'Bica ou meia de leite',  'Espresso or flat white', 'coffee',   'primary', 34, 80),
  ('c_nata',  'comum', 'Pastel de nata','Custard tart',    'Acabado de sair do forno','Fresh out of the oven', 'cake',     'red',     26, 60),
  ('c_d10',   'comum', '-10% na conta', '-10% off the bill','Na próxima visita',     'On your next visit',     'percent',  'green',   22, 50),
  ('c_combo', 'comum', 'Bica + nata',   'Espresso + tart', 'O clássico da casa',     'The house classic',      'sandwich', 'blue',    18, 40);

-- Prémios das raspadinhas — ESPECIAL
insert into public.prizes (id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, weight, stock) values
  ('e_ref',    'especial', 'Refeição grátis',        'Free meal',            'Prato do dia + bebida',   'Dish of the day + drink', 'plate',  'green',   20, 18),
  ('e_v10',    'especial', '10€ na próxima reserva', '€10 off next booking', 'Desconto no total da mesa','Off your table total',   'ticket', 'blue',    28, 30),
  ('e_d25',    'especial', '-25% na conta',          '-25% off the bill',    'Válido todo o dia',       'Valid all day',           'percent','red',     30, 25),
  ('e_kit',    'especial', 'Caneca + café 1 mês',    'Mug + coffee for a month','Edição Amigos do Bairro','Amigos do Bairro edition','gift',  'primary', 12, 8),
  ('e_brunch', 'especial', 'Brunch para 2',          'Brunch for 2',         'Ao fim-de-semana',        'On weekends',             'star',   'primary', 10, 6);

-- NOTA: criar staff/admin → registar na app e depois:
--   update public.profiles set role = 'admin' where id = '<uuid>';
