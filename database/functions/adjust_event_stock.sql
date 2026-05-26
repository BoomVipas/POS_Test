-- adjust_event_stock — manual stock adjustment for one event_inventory row:
-- add (restock) or remove (correction) p_delta units from current_qty, in ONE
-- transaction with an audit_logs row (hard rule #7). Refuses to drive
-- current_qty below 0. Workspace-scoped; roles owner/manager/stock_staff
-- (cashiers sell, they don't adjust stock). Returns the updated row.
--
-- adjusted_qty accumulates the manual deltas so post-event reconciliation can
-- separate "sold" from "hand-adjusted". Mirrors convert_event_to_sample.
--
-- payload (positional):
--   p_event_id   uuid
--   p_product_id uuid
--   p_delta      int   -- +restock / -correction; must be non-zero
--   p_reason     text  -- short audit reason (optional)

create or replace function public.adjust_event_stock(
  p_event_id   uuid,
  p_product_id uuid,
  p_delta      int,
  p_reason     text default null
)
returns public.event_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_workspace_id uuid;
  v_status       text;
  v_row          public.event_inventory;
  v_old          jsonb;
  v_new_qty      int;
begin
  if v_user_id is null then
    raise exception 'adjust_event_stock: auth required';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'adjust_event_stock: delta must be non-zero (got %)', p_delta
      using errcode = '22023';
  end if;

  select workspace_id, status into v_workspace_id, v_status
    from public.events where id = p_event_id;
  if v_workspace_id is null then
    raise exception 'adjust_event_stock: event % not found', p_event_id;
  end if;
  -- Closed/archived events are read-only: their stock history backs end-of-day
  -- and post-event reports, so it must not change after close.
  if v_status in ('closed', 'archived') then
    raise exception 'adjust_event_stock: cannot adjust stock on a closed or archived event (status=%)', v_status
      using errcode = '42501';
  end if;
  if not public.is_workspace_member(
    v_workspace_id, array['owner','manager','stock_staff']
  ) then
    raise exception 'adjust_event_stock: forbidden' using errcode = '42501';
  end if;

  select to_jsonb(ei.*) into v_old
    from public.event_inventory ei
    where ei.event_id = p_event_id and ei.product_id = p_product_id
    for update;

  if v_old is null then
    raise exception 'adjust_event_stock: no event_inventory row for event % product %',
      p_event_id, p_product_id;
  end if;

  v_new_qty := (v_old->>'current_qty')::int + p_delta;
  if v_new_qty < 0 then
    raise exception 'adjust_event_stock: would drive stock below zero (current_qty=%, delta=%)',
      v_old->>'current_qty', p_delta
      using errcode = '23514';
  end if;

  update public.event_inventory
    set current_qty  = v_new_qty,
        adjusted_qty = adjusted_qty + p_delta,
        updated_at   = now()
    where event_id = p_event_id and product_id = p_product_id
    returning * into v_row;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, old_value, new_value
  ) values (
    v_workspace_id, v_user_id, 'adjust_event_stock',
    'event_inventory', v_row.id,
    v_old,
    jsonb_build_object('delta', p_delta, 'reason', p_reason, 'after_row', to_jsonb(v_row))
  );

  return v_row;
end;
$$;

revoke all on function public.adjust_event_stock(uuid, uuid, int, text) from public;
grant execute on function public.adjust_event_stock(uuid, uuid, int, text) to authenticated;
