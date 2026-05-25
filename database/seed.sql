-- pos-for-sell local dev seed.
-- Apply AFTER schema.sql and rls-policies.sql.
-- Requires at least one Supabase Auth user to exist (sign up via the app first).
--
-- The seed treats the first auth.users row as both:
--   - the platform admin (admin_users)
--   - the demo workspace owner

do $$
declare
  v_user_id  uuid;
  v_ws_id    uuid;
  v_event_id uuid;
begin
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise notice '[seed] no auth.users row yet — sign up via the app, then re-run seed.sql';
    return;
  end if;

  -- platform admin
  insert into public.admin_users(user_id)
    values (v_user_id)
    on conflict (user_id) do nothing;

  -- demo workspace
  insert into public.workspaces(brand_name, slug, owner_user_id, industry, status, setup_complete)
    values ('Demo Cat Brand', 'demo-cat', v_user_id, 'cat_product', 'active', true)
    on conflict (slug) do update set owner_user_id = excluded.owner_user_id
    returning id into v_ws_id;

  -- owner membership
  insert into public.workspace_members(workspace_id, user_id, role)
    values (v_ws_id, v_user_id, 'owner')
    on conflict (workspace_id, user_id) do nothing;

  -- demo products
  insert into public.products(workspace_id, sku, name, category, price_satang, default_starting_qty, send_later_enabled)
    values
      (v_ws_id, 'DEMO-001', 'Cat Hoodie',         'apparel',     89000, 30,  true),
      (v_ws_id, 'DEMO-002', 'Catnip Toy',         'toys',        19000, 100, true),
      (v_ws_id, 'DEMO-003', 'Cat Sticker Pack',   'accessories',  9000, 200, true),
      (v_ws_id, 'DEMO-004', 'Premium Cat Treats', 'food',        29000, 50,  false),
      (v_ws_id, 'DEMO-005', 'Brushed Cat Bed',    'home',       149000, 10,  true)
    on conflict (workspace_id, sku) do nothing;

  -- demo event spanning today + 3 days
  select id into v_event_id
  from public.events
  where workspace_id = v_ws_id
    and name = 'Pilot Demo Expo'
  order by created_at desc
  limit 1;

  if v_event_id is null then
    insert into public.events(workspace_id, name, venue, start_date, end_date, status)
      values (v_ws_id, 'Pilot Demo Expo', 'Localhost', current_date, current_date + 3, 'planned')
      returning id into v_event_id;
  end if;

  -- starting inventory at the demo event
  insert into public.event_inventory(workspace_id, event_id, product_id, starting_qty, current_qty)
    select v_ws_id, v_event_id, p.id, p.default_starting_qty, p.default_starting_qty
    from public.products p
    where p.workspace_id = v_ws_id
    on conflict (event_id, product_id) do nothing;

  raise notice '[seed] complete: workspace=%, event=%', v_ws_id, v_event_id;
end $$;
