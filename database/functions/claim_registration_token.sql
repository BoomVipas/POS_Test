-- claim_registration_token — anon-callable. The customer scans the QR on
-- their receipt, lands on the portal, fills in their info + (optional) pet
-- info, and submits. The Server Action calls this RPC with the token and
-- payload.
--
-- Validates the token (exists, not expired, not already claimed). Creates
-- the customer row, contact rows, optional pet rows, and a customer_order_link
-- row in one transaction. Marks the token claimed.
--
-- payload (jsonb):
--   {
--     "customer": {
--       "display_name": "...",
--       "preferred_contact_method": "phone" | "email" | "line",
--       "consent_marketing": true | false
--     },
--     "contacts": [
--       { "channel": "phone" | "email" | "line" | "other",
--         "value": "...", "is_primary": true | false }
--     ],
--     "pets": [
--       { "name": "...", "species": "cat" | "dog" | ...,
--         "breed": "...", "weight_kg": 4.5, "birthday": "2020-03-04",
--         "adoption_day": "2020-04-01", "allergies": "...",
--         "preferences": "...", "note": "..." }
--     ]
--   }
--
-- Returns the new customer_id.
--
-- This function is the only public-anon write surface for customer data.
-- Every write goes through it, all writes are audit-logged.

create or replace function public.claim_registration_token(
  p_token   text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_row    public.customer_registration_tokens;
  v_workspace_id uuid;
  v_customer_id  uuid;
  v_contact      jsonb;
  v_pet          jsonb;
  v_now          timestamptz := now();
begin
  -- D5: every token-validation failure returns ONE indistinguishable error so
  -- the anon endpoint can't be used to enumerate which tokens exist / are live
  -- / are already claimed. The specific reason goes to the server log via
  -- RAISE LOG (which survives the transaction abort; an audit_logs row would
  -- be rolled back with the failed call, so it can't carry the reason here).
  if p_token is null or length(p_token) < 8 then
    raise log 'claim_registration_token: reject reason=malformed token_len=%',
      coalesce(length(p_token), 0);
    raise exception 'claim_registration_token: invalid token'
      using errcode = '22023';
  end if;
  if p_payload is null then
    -- Not a token oracle (the caller controls its own payload), so this stays
    -- a distinct, honest client error.
    raise exception 'claim_registration_token: payload required'
      using errcode = '22023';
  end if;

  select * into v_token_row
    from public.customer_registration_tokens
    where token = p_token
    for update;

  if v_token_row.id is null then
    raise log 'claim_registration_token: reject reason=not_found';
    raise exception 'claim_registration_token: invalid token'
      using errcode = '22023';
  end if;
  if v_token_row.claimed_at is not null then
    raise log 'claim_registration_token: reject reason=already_claimed token_id=%',
      v_token_row.id;
    raise exception 'claim_registration_token: invalid token'
      using errcode = '22023';
  end if;
  if v_token_row.expires_at < v_now then
    raise log 'claim_registration_token: reject reason=expired token_id=%',
      v_token_row.id;
    raise exception 'claim_registration_token: invalid token'
      using errcode = '22023';
  end if;

  v_workspace_id := v_token_row.workspace_id;

  -- Customer row.
  insert into public.customers(
    workspace_id,
    display_name,
    preferred_contact_method,
    consent_marketing,
    consent_marketing_at,
    registered_via,
    first_seen_at,
    last_seen_at
  ) values (
    v_workspace_id,
    nullif(p_payload->'customer'->>'display_name', ''),
    nullif(p_payload->'customer'->>'preferred_contact_method', ''),
    coalesce((p_payload->'customer'->>'consent_marketing')::boolean, false),
    case when (p_payload->'customer'->>'consent_marketing')::boolean = true
         then v_now else null end,
    'portal',
    v_now,
    v_now
  )
  returning id into v_customer_id;

  -- Contacts.
  if jsonb_typeof(p_payload->'contacts') = 'array' then
    for v_contact in select * from jsonb_array_elements(p_payload->'contacts')
    loop
      if (v_contact->>'value') is null
         or length(v_contact->>'value') = 0
      then continue; end if;
      insert into public.customer_contacts(
        workspace_id, customer_id, channel, value, is_primary
      ) values (
        v_workspace_id,
        v_customer_id,
        coalesce(v_contact->>'channel', 'phone'),
        v_contact->>'value',
        coalesce((v_contact->>'is_primary')::boolean, false)
      )
      on conflict (workspace_id, channel, value) do nothing;
    end loop;
  end if;

  -- Pets (optional).
  if jsonb_typeof(p_payload->'pets') = 'array' then
    for v_pet in select * from jsonb_array_elements(p_payload->'pets')
    loop
      if (v_pet->>'name') is null or length(v_pet->>'name') = 0
      then continue; end if;
      insert into public.pets(
        workspace_id, customer_id, name, species,
        breed, weight_kg, birthday, adoption_day,
        allergies, preferences, note
      ) values (
        v_workspace_id,
        v_customer_id,
        v_pet->>'name',
        coalesce(v_pet->>'species', 'cat'),
        nullif(v_pet->>'breed', ''),
        nullif(v_pet->>'weight_kg', '')::numeric(5,2),
        nullif(v_pet->>'birthday', '')::date,
        nullif(v_pet->>'adoption_day', '')::date,
        nullif(v_pet->>'allergies', ''),
        nullif(v_pet->>'preferences', ''),
        nullif(v_pet->>'note', '')
      );
    end loop;
  end if;

  -- Order link.
  insert into public.customer_order_links(
    workspace_id, customer_id, order_id, linked_via, linked_at
  ) values (
    v_workspace_id, v_customer_id, v_token_row.order_id, 'portal', v_now
  )
  on conflict (customer_id, order_id) do nothing;

  -- Mark token claimed.
  update public.customer_registration_tokens
    set claimed_at = v_now,
        claimed_customer_id = v_customer_id
    where id = v_token_row.id;

  -- Audit. Anon flow has no auth.uid(); store null user_id.
  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, new_value
  ) values (
    v_workspace_id, null, 'claim_registration_token',
    'customers', v_customer_id,
    jsonb_build_object(
      'order_id', v_token_row.order_id,
      'pet_count', coalesce(jsonb_array_length(p_payload->'pets'), 0),
      'contact_count', coalesce(jsonb_array_length(p_payload->'contacts'), 0),
      'consent_marketing', coalesce(
        (p_payload->'customer'->>'consent_marketing')::boolean, false
      )
    )
  );

  return v_customer_id;
end;
$$;

-- Anon callable on purpose: the customer-facing portal has no auth session.
-- The token IS the credential. Without a valid token, the function aborts.
revoke all on function public.claim_registration_token(text, jsonb) from public;
grant execute on function public.claim_registration_token(text, jsonb) to anon, authenticated;
