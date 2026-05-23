-- create_order — atomic sale write.
--
-- payload (jsonb):
-- {
--   "workspace_id":  uuid,
--   "event_id":      uuid,
--   "items": [
--     { "product_id": uuid, "qty": int, "fulfillment": "take_now"|"send_later",
--       "is_sample": bool (optional), "note": text (optional) }
--   ],
--   "payment_method":     "cash"|"promptpay"|"transfer"|"card"|"other"|"sample"|"mixed",
--   "discount_satang":    bigint (optional, default 0),
--   "customer_name":      text (optional),
--   "customer_phone":     text (optional, required if any item is send_later),
--   "customer_email":     text (optional),
--   "shipping_address":   text (required if any item is send_later),
--   "shipping_method":    text (optional),
--   "note":               text (optional),
--   "payments":           [{ "method": ..., "amount_satang": ..., "slip_path": ... }]
--                         (optional; if omitted, a single payment record matching total is created)
-- }

create or replace function public.create_order(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id   uuid := (payload->>'workspace_id')::uuid;
  v_event_id       uuid := (payload->>'event_id')::uuid;
  v_payment_method text := payload->>'payment_method';
  v_discount       bigint := coalesce((payload->>'discount_satang')::bigint, 0);
  v_user_id        uuid := auth.uid();
  v_order_id       uuid := gen_random_uuid();
  v_seq            int;
  v_order_number   text;
  v_subtotal       bigint := 0;
  v_shipping       bigint := 0;
  v_total          bigint;
  v_event_status   text;
  v_has_send_later boolean := false;
  v_has_take_now   boolean := false;
  v_order_type     text;
  v_discount_max   bigint;
  v_discount_capped boolean := false;
  v_item           jsonb;
begin
  if v_user_id is null then
    raise exception 'create_order: auth required';
  end if;

  if not public.is_workspace_member(v_workspace_id, array['owner','manager','cashier']) then
    raise exception 'create_order: forbidden (workspace=%)', v_workspace_id
      using errcode = '42501';
  end if;

  -- Serialize per-event order creation by locking the event row.
  select status into v_event_status
    from public.events
    where id = v_event_id and workspace_id = v_workspace_id
    for update;
  if not found then
    raise exception 'create_order: event % not in workspace %', v_event_id, v_workspace_id;
  end if;
  if v_event_status not in ('planned','running') then
    raise exception 'create_order: event % status is %', v_event_id, v_event_status;
  end if;

  -- Allocate order number for this event ("event_001", "event_002", ...).
  select coalesce(max(cast(split_part(order_number, '_', 2) as int)), 0) + 1
    into v_seq
    from public.orders
    where event_id = v_event_id;
  v_order_number := 'event_' || lpad(v_seq::text, 3, '0');

  -- Insert order header with placeholder totals (fixed up at end).
  insert into public.orders(
    id, workspace_id, event_id, order_number, cashier_user_id,
    customer_name, customer_phone, customer_email,
    order_type, payment_method, payment_status,
    subtotal_satang, discount_satang, shipping_fee_satang, total_satang,
    status, note
  ) values (
    v_order_id, v_workspace_id, v_event_id, v_order_number, v_user_id,
    nullif(payload->>'customer_name', ''),
    nullif(payload->>'customer_phone', ''),
    nullif(payload->>'customer_email', ''),
    'take_now', -- patched below
    v_payment_method,
    case when v_payment_method = 'sample' then 'paid' else 'paid' end,
    0, v_discount, 0, 0,
    'completed',
    nullif(payload->>'note', '')
  );

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    declare
      v_product_id    uuid := (v_item->>'product_id')::uuid;
      v_qty           int  := (v_item->>'qty')::int;
      v_fulfill       text := coalesce(v_item->>'fulfillment', 'take_now');
      v_note          text := nullif(v_item->>'note', '');
      v_is_sample     boolean := coalesce((v_item->>'is_sample')::boolean, false);
      v_unit_price    bigint;
      v_line_total    bigint;
      v_inv_id        uuid;
      v_inv_remaining int;
      v_product_name  text;
      v_sku           text;
      v_ship_fee      bigint;
    begin
      if v_qty <= 0 then
        raise exception 'create_order: item qty must be > 0';
      end if;

      select sku, name, price_satang, shipping_fee_satang
        into v_sku, v_product_name, v_unit_price, v_ship_fee
        from public.products
        where id = v_product_id
          and workspace_id = v_workspace_id
          and is_active = true;
      if not found then
        raise exception 'create_order: product % not active in workspace %', v_product_id, v_workspace_id;
      end if;

      select id, current_qty into v_inv_id, v_inv_remaining
        from public.event_inventory
        where event_id = v_event_id and product_id = v_product_id
        for update;
      if not found then
        raise exception 'create_order: no inventory row for product % at event %',
          v_product_id, v_event_id;
      end if;
      if v_inv_remaining < v_qty then
        raise exception 'create_order: insufficient stock for product % (remaining=%, requested=%)',
          v_product_id, v_inv_remaining, v_qty;
      end if;

      v_line_total := v_unit_price * v_qty;
      if not v_is_sample then
        v_subtotal := v_subtotal + v_line_total;
      end if;
      if v_fulfill = 'send_later' then
        v_shipping := v_shipping + v_ship_fee * v_qty;
        v_has_send_later := true;
      else
        v_has_take_now := true;
      end if;

      insert into public.order_items(
        workspace_id, order_id, product_id, sku, product_name,
        qty, unit_price_satang, line_total_satang, fulfillment_type, is_sample, note
      ) values (
        v_workspace_id, v_order_id, v_product_id, v_sku, v_product_name,
        v_qty,
        case when v_is_sample then 0 else v_unit_price end,
        case when v_is_sample then 0 else v_line_total end,
        v_fulfill, v_is_sample, v_note
      );

      update public.event_inventory
        set current_qty = current_qty - v_qty,
            sold_qty    = sold_qty + v_qty,
            updated_at  = now()
        where id = v_inv_id;
    end;
  end loop;

  if v_has_send_later and v_has_take_now then
    v_order_type := 'mixed';
  elsif v_has_send_later then
    v_order_type := 'send_later';
  elsif v_payment_method = 'sample' then
    v_order_type := 'sample';
  else
    v_order_type := 'take_now';
  end if;

  -- D3: cap the discount at what the order can actually absorb. Without this a
  -- client-supplied discount persists into orders.discount_satang unchecked
  -- (the total is clamped to 0 but the absurd discount value still poisons
  -- dashboard/margin reports).
  v_discount_max := v_subtotal + v_shipping;
  if v_discount > v_discount_max then
    v_discount := v_discount_max;
    v_discount_capped := true;
  end if;

  v_total := greatest(0, v_subtotal + v_shipping - v_discount);

  update public.orders
    set order_type          = v_order_type,
        subtotal_satang     = v_subtotal,
        shipping_fee_satang = v_shipping,
        discount_satang     = v_discount,
        total_satang        = v_total
    where id = v_order_id;

  if v_has_send_later then
    insert into public.send_later_orders(
      workspace_id, order_id, customer_name, customer_phone,
      shipping_address, shipping_method, shipping_fee_satang
    ) values (
      v_workspace_id, v_order_id,
      coalesce(nullif(payload->>'customer_name', ''),  'Unknown'),
      coalesce(nullif(payload->>'customer_phone', ''), 'Unknown'),
      coalesce(nullif(payload->>'shipping_address', ''), 'TBD'),
      nullif(payload->>'shipping_method', ''),
      v_shipping
    );
  end if;

  if payload ? 'payments' and jsonb_array_length(payload->'payments') > 0 then
    -- D2: a supplied payments array must reconcile to the order total, or the
    -- order's recorded tenders silently disagree with what was charged.
    declare
      v_pay_sum bigint;
    begin
      select coalesce(sum((p->>'amount_satang')::bigint), 0)
        into v_pay_sum
        from jsonb_array_elements(payload->'payments') p;
      if v_pay_sum <> v_total then
        raise exception
          'create_order: payments sum (% satang) does not match order total (% satang); off by %',
          v_pay_sum, v_total, abs(v_pay_sum - v_total)
          using errcode = '22000';
      end if;
    end;
    for v_item in select * from jsonb_array_elements(payload->'payments')
    loop
      insert into public.payment_records(
        workspace_id, order_id, payment_method, amount_satang,
        slip_path, confirmed_by, confirmed_at
      ) values (
        v_workspace_id, v_order_id,
        v_item->>'method',
        (v_item->>'amount_satang')::bigint,
        nullif(v_item->>'slip_path', ''),
        v_user_id, now()
      );
    end loop;
  elsif v_payment_method = 'mixed' then
    -- D1: a "mixed" order with no payments[] would otherwise record a paid,
    -- completed order with zero payment records. Itemising the tenders is the
    -- whole point of the mixed method, so require them.
    raise exception
      'create_order: payment_method=mixed requires a non-empty payments array'
      using errcode = '22000';
  elsif v_payment_method <> 'sample' then
    insert into public.payment_records(
      workspace_id, order_id, payment_method, amount_satang, confirmed_by, confirmed_at
    ) values (v_workspace_id, v_order_id, v_payment_method, v_total, v_user_id, now());
  end if;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, new_value
  ) values (
    v_workspace_id, v_user_id, 'create_order', 'orders', v_order_id,
    jsonb_build_object(
      'order_number', v_order_number,
      'total_satang', v_total,
      'discount_satang', v_discount,
      'discount_capped', v_discount_capped,
      'order_type', v_order_type,
      'payment_method', v_payment_method
    )
  );

  return v_order_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to authenticated;
