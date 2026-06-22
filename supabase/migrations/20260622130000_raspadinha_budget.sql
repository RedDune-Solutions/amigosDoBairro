-- =============================================================================
-- Raspadinha: percentagens ABSOLUTAS (orçamento de 100% por pool).
-- weight = % de probabilidade. Se a soma da pool < 100, o resto é "sem prémio".
-- A app/admin garante soma <= 100; aqui o sorteio é sobre 0..99.
-- =============================================================================

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
  won     public.prizes%rowtype;
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

  select coalesce(sum(weight), 0) into total_w
    from public.prizes where kind = card.kind and ativo;
  if total_w = 0 then
    raise exception 'Sem prémios disponíveis.';
  end if;

  -- sorteio sobre 100%: pick em [0,100). Se cair fora dos pesos alocados → sem prémio.
  pick := floor(random() * 100);
  for pr in select * from public.prizes where kind = card.kind and ativo order by id loop
    acc := acc + pr.weight;
    if pick < acc then
      won := pr;
      exit;
    end if;
  end loop;

  -- Sem prémio: marca aberta sem prize e sem item de carteira.
  if won.id is null then
    update public.scratch_cards set status = 'aberta', prize_id = null where id = p_card;
    return json_build_object('none', true);
  end if;

  update public.scratch_cards set status = 'aberta', prize_id = won.id where id = p_card;

  v_code := 'AB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  insert into public.wallet_items (user_id, prize_id, kind, nome_pt, nome_en, desc_pt, desc_en, icon, accent, codigo)
  values (v_uid, won.id, won.kind, won.nome_pt, won.nome_en, won.desc_pt, won.desc_en, won.icon, won.accent, v_code);

  return json_build_object('prize_id', won.id, 'nome_pt', won.nome_pt, 'nome_en', won.nome_en,
    'desc_pt', won.desc_pt, 'desc_en', won.desc_en, 'icon', won.icon, 'accent', won.accent, 'codigo', v_code);
end;
$$;
