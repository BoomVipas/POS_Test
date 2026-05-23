-- create_registration_token — issue a one-shot post-purchase registration
-- token for a completed order. The cashier (or the receipt success screen)
-- calls this; the returned token is encoded into the receipt QR / share link.
--
-- The customer-facing portal validates and consumes the token via
-- `claim_registration_token`. This function only creates it.
--
-- Roles: owner, manager, cashier (any sale-touching role).

create or replace function public.create_registration_token(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_workspace_id uuid;
  v_token        text;
begin
  if v_user_id is null then
    raise exception 'create_registration_token: auth required';
  end if;

  select workspace_id into v_workspace_id
    from public.orders where id = p_order_id;
  if v_workspace_id is null then
    raise exception 'create_registration_token: order % not found', p_order_id;
  end if;
  if not public.is_workspace_member(
    v_workspace_id, array['owner','manager','cashier']
  ) then
    raise exception 'create_registration_token: forbidden' using errcode = '42501';
  end if;

  -- 16-char url-safe token. Re-roll on collision OR when stripping url-unsafe
  -- chars drops the candidate below the 16-char floor (D6 — the old code only
  -- truncated when long enough and would otherwise emit a short token). 18 raw
  -- bytes -> 24 base64 chars gives ample headroom so re-rolls are rare.
  loop
    v_token := encode(gen_random_bytes(18), 'base64');
    -- Strip url-unsafe chars so the QR / link stays clean.
    v_token := replace(replace(replace(v_token, '/', ''), '+', ''), '=', '');
    if length(v_token) < 16 then
      continue;  -- strip-heavy draw; re-roll rather than ship a short token
    end if;
    v_token := substr(v_token, 1, 16);
    exit when not exists (
      select 1 from public.customer_registration_tokens t where t.token = v_token
    );
  end loop;

  insert into public.customer_registration_tokens(
    workspace_id, order_id, token, created_by_user_id
  ) values (
    v_workspace_id, p_order_id, v_token, v_user_id
  );

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, new_value
  ) values (
    v_workspace_id, v_user_id, 'create_registration_token',
    'customer_registration_tokens', p_order_id,
    jsonb_build_object('token_length', length(v_token), 'order_id', p_order_id)
  );

  return v_token;
end;
$$;

revoke all on function public.create_registration_token(uuid) from public;
grant execute on function public.create_registration_token(uuid) to authenticated;
