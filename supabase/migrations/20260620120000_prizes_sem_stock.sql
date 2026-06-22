-- Prémios da raspadinha saem SEMPRE por probabilidade (peso), sem limite de stock.
-- Remove o gating por stock do sorteio e a coluna stock da tabela prizes.

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

  -- sorteio ponderado sobre os prémios ACTIVOS do tipo certo (sem stock)
  select coalesce(sum(weight), 0) into total_w
    from public.prizes where kind = card.kind and ativo;
  if total_w = 0 then
    raise exception 'Sem prémios disponíveis.';
  end if;
  pick := floor(random() * total_w);
  for pr in select * from public.prizes where kind = card.kind and ativo order by id loop
    acc := acc + pr.weight;
    if pick < acc then exit; end if;
  end loop;

  -- marca raspadinha aberta + adiciona à carteira (sem consumir stock)
  update public.scratch_cards set status = 'aberta', prize_id = pr.id where id = p_card;

  v_code := 'AB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  insert into public.wallet_items (user_id, prize_id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, codigo)
  values (v_uid, pr.id, pr.kind, pr.nome_pt, pr.nome_en, pr.desc_pt, pr.desc_en, pr.icon, pr.accent, v_code);

  return json_build_object('prize_id', pr.id, 'nome_pt', pr.nome_pt, 'nome_en', pr.nome_en,
    'desc_pt', pr.desc_pt, 'desc_en', pr.desc_en, 'icon', pr.icon, 'accent', pr.accent, 'codigo', v_code);
end;
$$;

-- Coluna deixa de existir: o prémio nunca esgota, sai sempre conforme o peso.
alter table public.prizes drop column if exists stock;
