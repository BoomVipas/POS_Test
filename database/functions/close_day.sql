-- close_day — persist an end-of-day cash reconciliation record + audit row in
-- one transaction (hard rule #7). The RPC RE-COMPUTES expected cash from the
-- real payment_records (cash tenders of non-voided orders created that Bangkok
-- day) rather than trusting a caller-supplied figure, so the stored record is
-- authoritative and can't be poisoned. Discrepancy = counted − expected.
--
-- Roles: owner, manager, cashier (the cashier counts the drawer at close).
-- Multiple closes per day are allowed (re-counts) — history, not a unique key.
--
-- params:
--   p_workspace_id          uuid
--   p_iso_date              date    -- the Bangkok calendar day being closed
--   p_counted_cash_satang   bigint  -- what was physically counted (>= 0)
--   p_reason                text    -- explanation (recommended when != 0)

create or replace function public.close_day(
  p_workspace_id        uuid,
  p_iso_date            date,
  p_counted_cash_satang bigint,
  p_reason              text default null
)
returns public.close_day_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid := auth.uid();
  v_day_start   timestamptz;
  v_day_end     timestamptz;
  v_expected    bigint;
  v_discrepancy bigint;
  v_row         public.close_day_records;
begin
  if v_user_id is null then
    raise exception 'close_day: auth required';
  end if;
  if p_counted_cash_satang is null or p_counted_cash_satang < 0 then
    raise exception 'close_day: counted cash must be >= 0 (got %)', p_counted_cash_satang
      using errcode = '22023';
  end if;
  if not public.is_workspace_member(
    p_workspace_id, array['owner','manager','cashier']
  ) then
    raise exception 'close_day: forbidden' using errcode = '42501';
  end if;

  -- Bangkok-day boundaries for the requested date (UTC+7, no DST).
  v_day_start := (p_iso_date::timestamp) at time zone 'Asia/Bangkok';
  v_day_end   := ((p_iso_date + 1)::timestamp) at time zone 'Asia/Bangkok';

  select coalesce(sum(pr.amount_satang), 0) into v_expected
    from public.payment_records pr
    join public.orders o on o.id = pr.order_id
    where pr.workspace_id = p_workspace_id
      and pr.payment_method = 'cash'
      and o.status <> 'voided'
      and o.created_at >= v_day_start
      and o.created_at <  v_day_end;

  v_discrepancy := p_counted_cash_satang - v_expected;

  -- A non-zero drawer MUST be explained — enforced here, not just client-side:
  -- the RPC recomputes expected at write time, so a sale landing between the
  -- cashier's on-screen preview and submit could otherwise persist a reasonless
  -- discrepancy and weaken the audit trail. Mirrors the client's >=3-char rule.
  if v_discrepancy <> 0 and length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception
      'close_day: a reason (>= 3 chars) is required when the drawer does not match (discrepancy=% satang)',
      v_discrepancy
      using errcode = '22023';
  end if;

  insert into public.close_day_records(
    workspace_id, iso_date, expected_cash_satang, counted_cash_satang,
    discrepancy_satang, reason, closed_by_user_id
  ) values (
    p_workspace_id, p_iso_date, v_expected, p_counted_cash_satang,
    v_discrepancy, nullif(trim(p_reason), ''), v_user_id
  )
  returning * into v_row;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, old_value, new_value
  ) values (
    p_workspace_id, v_user_id, 'close_day', 'close_day_records', v_row.id,
    null,
    jsonb_build_object(
      'iso_date',             p_iso_date,
      'expected_cash_satang', v_expected,
      'counted_cash_satang',  p_counted_cash_satang,
      'discrepancy_satang',   v_discrepancy,
      'reason',               nullif(trim(p_reason), '')
    )
  );

  return v_row;
end;
$$;

revoke all on function public.close_day(uuid, date, bigint, text) from public;
grant execute on function public.close_day(uuid, date, bigint, text) to authenticated;
