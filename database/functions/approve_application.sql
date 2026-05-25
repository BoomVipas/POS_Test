-- approve_application — DD-26/27 — admin approves a pending application and
-- mints its invite code in one transaction.
--
-- Mirrors the redeem_invite_code pattern: a security-definer RPC that performs
-- the multi-table write (insert invite_codes + flip applications + audit) so it
-- is all-or-nothing and the audit row can never drift from the change (hard
-- rule #7). The ambiguity-safe code is generated client-side by the canonical
-- TS generator (lib/invite-code) and passed in as p_code — keeping one source
-- of truth for the alphabet — so on the (astronomically rare) unique collision
-- the caller just regenerates and retries.
--
-- Concurrency: the `for update` lock + the `status = 'pending'` guard make a
-- double-click safe — the second caller blocks, then sees 'invited' and raises
-- rather than minting a second code for the same application.

create or replace function public.approve_application(
  p_application_id uuid,
  p_code           text
)
returns public.invite_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_app     record;
  v_invite  public.invite_codes;
begin
  if v_user_id is null then
    raise exception 'approve_application: auth required';
  end if;
  if not public.is_admin() then
    raise exception 'approve_application: admin required';
  end if;
  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'approve_application: code required';
  end if;

  select * into v_app from public.applications where id = p_application_id for update;
  if not found then
    raise exception 'approve_application: application not found';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'approve_application: application is % (only pending can be approved)', v_app.status;
  end if;

  insert into public.invite_codes(application_id, code, email, brand_name, created_by)
    values (p_application_id, p_code, v_app.email, v_app.brand_name, v_user_id)
    returning * into v_invite;

  update public.applications
    set status = 'invited', reviewed_at = now(), reviewed_by = v_user_id
    where id = p_application_id;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, new_value
  ) values (
    null, v_user_id, 'approve_application', 'applications', p_application_id,
    jsonb_build_object('code', p_code, 'email', v_app.email, 'brand_name', v_app.brand_name)
  );

  return v_invite;
end;
$$;

revoke all on function public.approve_application(uuid, text) from public;
grant execute on function public.approve_application(uuid, text) to authenticated;
