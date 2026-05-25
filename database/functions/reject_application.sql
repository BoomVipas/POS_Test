-- reject_application — DD-26 — admin rejects a pending application.
--
-- A single-table update (applications.status) plus an audit row, wrapped in a
-- security-definer RPC for the same reasons as approve_application: the audit
-- write (hard rule #7) stays in the same transaction as the status change, and
-- the admin gate + 'pending'-only guard live next to the redeem/approve logic
-- instead of being re-implemented in the client.

create or replace function public.reject_application(
  p_application_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_app     record;
begin
  if v_user_id is null then
    raise exception 'reject_application: auth required';
  end if;
  if not public.is_admin() then
    raise exception 'reject_application: admin required';
  end if;

  select * into v_app from public.applications where id = p_application_id for update;
  if not found then
    raise exception 'reject_application: application not found';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'reject_application: application is % (only pending can be rejected)', v_app.status;
  end if;

  update public.applications
    set status = 'rejected', reviewed_at = now(), reviewed_by = v_user_id
    where id = p_application_id;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, new_value
  ) values (
    null, v_user_id, 'reject_application', 'applications', p_application_id,
    jsonb_build_object('email', v_app.email, 'brand_name', v_app.brand_name)
  );
end;
$$;

revoke all on function public.reject_application(uuid) from public;
grant execute on function public.reject_application(uuid) to authenticated;
