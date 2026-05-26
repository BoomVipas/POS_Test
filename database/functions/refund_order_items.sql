-- refund_order_items — partial per-line refund of a recorded order. For each
-- requested line it caps qty at the remaining (order_item.qty − already-refunded),
-- records an order_refunds row, restores event_inventory (current_qty += qty,
-- sold_qty −= qty) for that line's product, and writes ONE audit row — all in one
-- transaction (hard rules #6/#7). Owner/manager only. Rejects voided orders. A
-- reason (>= 3 chars) is required (enforced here, not just client-side — same
-- lesson as close_day).
--
-- params:
--   p_order_id uuid
--   p_lines    jsonb  -- [{ "order_item_id": uuid, "qty": int }, ...]
--   p_reason   text
-- returns jsonb summary: { refunded_qty, refunded_amount_satang, lines }

create or replace function public.refund_order_items(
  p_order_id uuid,
  p_lines    jsonb,
  p_reason   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_workspace_id uuid;
  v_event_id     uuid;
  v_status       text;
  v_subtotal     bigint;
  v_discount     bigint;
  v_goods_discount bigint;
  v_line         jsonb;
  v_item_id      uuid;
  v_qty          int;
  v_oi           public.order_items;
  v_already      int;
  v_remaining    int;
  v_amount       bigint;
  v_line_gross   bigint;
  v_total_amount bigint := 0;
  v_total_qty    int := 0;
  v_count        int := 0;
begin
  if v_user_id is null then
    raise exception 'refund_order_items: auth required';
  end if;

  select workspace_id, event_id, status, subtotal_satang, discount_satang
    into v_workspace_id, v_event_id, v_status, v_subtotal, v_discount
    from public.orders where id = p_order_id
    for update;
  if v_workspace_id is null then
    raise exception 'refund_order_items: order % not found', p_order_id;
  end if;
  if not public.is_workspace_member(v_workspace_id, array['owner','manager']) then
    raise exception 'refund_order_items: forbidden' using errcode = '42501';
  end if;
  if v_status = 'voided' then
    raise exception 'refund_order_items: order % is voided — nothing to refund', p_order_id
      using errcode = '22000';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'refund_order_items: a reason (>= 3 chars) is required'
      using errcode = '22023';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'refund_order_items: no lines to refund' using errcode = '22023';
  end if;

  -- The order-level discount is spread proportionally across the goods
  -- (subtotal), capped at the subtotal — any excess discount came off shipping,
  -- which we don't refund per line. So a line refunds its gross share of what was
  -- ACTUALLY paid, not its sticker price (avoids over-refunding discounted sales).
  v_goods_discount := least(coalesce(v_discount, 0), coalesce(v_subtotal, 0));

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_item_id := (v_line->>'order_item_id')::uuid;
    v_qty     := (v_line->>'qty')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'refund_order_items: qty must be positive' using errcode = '22023';
    end if;

    select * into v_oi from public.order_items
      where id = v_item_id and order_id = p_order_id and workspace_id = v_workspace_id
      for update;
    if not found then
      raise exception 'refund_order_items: line % is not on order %', v_item_id, p_order_id;
    end if;

    select coalesce(sum(qty), 0) into v_already
      from public.order_refunds where order_item_id = v_item_id;
    v_remaining := v_oi.qty - v_already;
    if v_qty > v_remaining then
      raise exception 'refund_order_items: line % refund qty % exceeds remaining %',
        v_item_id, v_qty, v_remaining
        using errcode = '23514';
    end if;

    -- Discount-adjusted refund: the line's gross share of what was actually paid
    -- after the order-level discount. Samples (unit_price 0) refund ฿0. Floor so
    -- we never refund more than the customer paid.
    v_line_gross := v_oi.unit_price_satang * v_qty;
    v_amount := case
      when v_subtotal > 0 then
        floor(v_line_gross::numeric * (v_subtotal - v_goods_discount) / v_subtotal)::bigint
      else 0
    end;

    insert into public.order_refunds(
      workspace_id, order_id, order_item_id, qty, amount_satang, reason, refunded_by_user_id
    ) values (
      v_workspace_id, p_order_id, v_item_id, v_qty, v_amount,
      nullif(trim(p_reason), ''), v_user_id
    );

    update public.event_inventory
      set current_qty = current_qty + v_qty,
          sold_qty    = greatest(0, sold_qty - v_qty),
          updated_at  = now()
      where event_id = v_event_id and product_id = v_oi.product_id;

    v_total_amount := v_total_amount + v_amount;
    v_total_qty    := v_total_qty + v_qty;
    v_count        := v_count + 1;
  end loop;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, old_value, new_value
  ) values (
    v_workspace_id, v_user_id, 'refund_order_items', 'orders', p_order_id, null,
    jsonb_build_object(
      'refunded_qty', v_total_qty,
      'refunded_amount_satang', v_total_amount,
      'lines', v_count,
      'reason', nullif(trim(p_reason), '')
    )
  );

  return jsonb_build_object(
    'refunded_qty', v_total_qty,
    'refunded_amount_satang', v_total_amount,
    'lines', v_count
  );
end;
$$;

revoke all on function public.refund_order_items(uuid, jsonb, text) from public;
grant execute on function public.refund_order_items(uuid, jsonb, text) to authenticated;
