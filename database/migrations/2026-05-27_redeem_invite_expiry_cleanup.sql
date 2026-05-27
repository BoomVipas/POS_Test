-- Remove the dead lazy-expiry write from redeem_invite_code.
--
-- The previous function tried to set invite_codes.status = 'expired' immediately
-- before raising "code expired". In PostgreSQL, the raised exception aborts the
-- function transaction, so that status write is rolled back and never persists.
-- The real gate remains expires_at < now().

create or replace function public.redeem_invite_code(
  p_code       text,
  p_brand_name text,
  p_slug       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_invite       record;
  v_workspace_id uuid;
begin
  if v_user_id is null then
    raise exception 'redeem_invite_code: auth required';
  end if;
  if p_brand_name is null or length(trim(p_brand_name)) = 0 then
    raise exception 'redeem_invite_code: brand_name required';
  end if;
  if p_slug is null or length(trim(p_slug)) = 0 then
    raise exception 'redeem_invite_code: slug required';
  end if;
  if not p_slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' then
    raise exception 'redeem_invite_code: invalid slug format "%"', p_slug;
  end if;

  select * into v_invite from public.invite_codes where code = p_code for update;
  if not found then
    raise exception 'redeem_invite_code: invalid code';
  end if;
  if v_invite.status = 'used' then
    raise exception 'redeem_invite_code: code already used';
  end if;
  if v_invite.status = 'cancelled' then
    raise exception 'redeem_invite_code: code cancelled';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'redeem_invite_code: code expired';
  end if;

  -- One workspace per owner_user_id during the pilot (defensive - DB schema permits more).
  if exists (select 1 from public.workspaces where owner_user_id = v_user_id) then
    raise exception 'redeem_invite_code: user already owns a workspace';
  end if;

  insert into public.workspaces(brand_name, slug, owner_user_id)
    values (p_brand_name, p_slug, v_user_id)
    returning id into v_workspace_id;

  insert into public.workspace_members(workspace_id, user_id, role)
    values (v_workspace_id, v_user_id, 'owner');

  update public.invite_codes
    set status          = 'used',
        used_at         = now(),
        used_by_user_id = v_user_id
    where id = v_invite.id;

  update public.applications
    set status = 'registered'
    where id = v_invite.application_id;

  insert into public.audit_logs(
    workspace_id, user_id, action, target_table, target_id, new_value
  ) values (
    v_workspace_id, v_user_id, 'redeem_invite_code', 'workspaces', v_workspace_id,
    jsonb_build_object('code', p_code, 'brand_name', p_brand_name, 'slug', p_slug)
  );

  return v_workspace_id;
end;
$$;

revoke all on function public.redeem_invite_code(text, text, text) from public;
grant execute on function public.redeem_invite_code(text, text, text) to authenticated;
