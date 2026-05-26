-- convert_event_to_sample — atomically move N units from event booth stock
-- (`current_qty`) into the sample bucket (`sample_qty`). Used when staff put
-- a unit on display at the booth as a sample.
--
-- Returns the updated event_inventory row. Refuses to underflow current_qty.
-- Audit-logged. Workspace-scoped via RLS.
--
-- payload (positional):
--   p_event_id   uuid    -- which event
--   p_product_id uuid    -- which SKU
--   p_qty        int     -- how many to move into sample (must be > 0)
--   p_reason     text    -- short audit reason (optional)
--
-- Roles: owner, manager, cashier, stock_staff. Viewers are blocked.

create or replace function public.convert_event_to_sample(
  p_event_id   uuid,
  p_product_id uuid,
  p_qty        int,
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
begin
  if v_user_id is null then
    raise exception 'convert_event_to_sample: auth required';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'convert_event_to_sample: qty must be positive (got %)', p_qty
      using errcode = '22023';
  end if;

  select workspace_id, status into v_workspace_id, v_status
    from public.events where id = p_event_id;
  if v_workspace_id is null then
    raise exception 'convert_event_to_sample: event % not found', p_event_id;
  end if;
  -- Closed/archived events are read-only (mirror adjust_event_stock): their stock
  -- backs end-of-day + post-event reports and must not change after close.
  if v_status in ('closed', 'archived') then
    raise exception 'convert_event_to_sample: cannot move stock on a closed or archived event (status=%)', v_status
      using errcode = '42501';
  end if;
  if not public.is_workspace_member(
    v_workspace_id, array['owner','manager','cashier','stock_staff']
  ) then
    raise exception 'convert_event_to_sample: forbidden' using errcode = '42501';
  end if;

  select to_jsonb(ei.*) into v_old
    from public.event_inventory ei
    where ei.event_id = p_event_id and ei.product_id = p_product_id
    for update;

  if v_old is null then
    raise exception 'convert_event_to_sample: no event_inventory row for event % product %',
      p_event_id, p_product_id;
  end if;

  if (v_old->>'current_qty')::int < p_qty then
    raise exception 'convert_event_to_sample: not enough event stock (current_qty=%, requested=%)',
      v_old->>'current_qty', p_qty
      using errcode = '23514';
  end if;

  update public.event_inventory
    set current_qty = current_qty - p_qty,
        sample_qty  = sample_qty  + p_qty,
        updated_at  = now()
    where event_id = p_event_id and product_id = p_product_id
    returning * into v_row;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, old_value, new_value
  ) values (
    v_workspace_id, v_user_id, 'convert_event_to_sample',
    'event_inventory', v_row.id,
    v_old,
    jsonb_build_object(
      'qty',       p_qty,
      'reason',    p_reason,
      'after_row', to_jsonb(v_row)
    )
  );

  return v_row;
end;
$$;

revoke all on function public.convert_event_to_sample(uuid, uuid, int, text) from public;
grant execute on function public.convert_event_to_sample(uuid, uuid, int, text) to authenticated;
