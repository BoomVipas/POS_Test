-- pos-for-sell RLS policies
-- Apply AFTER schema.sql.
-- Strategy:
--   - applications:  anon insert; admin select/update.
--   - admin_users / invite_codes: admin only.
--   - workspaces / workspace_members: visible to members; mutations gated by role.
--   - products / events / event_inventory / send_later_orders: workspace-scoped CRUD by role.
--   - orders / order_items / payment_records: SELECT for members; mutations only via security-definer RPCs.
--   - audit_logs: SELECT for members of the row's workspace; INSERT only via RPCs.

alter table public.applications        enable row level security;
alter table public.admin_users         enable row level security;
alter table public.invite_codes        enable row level security;
alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.products            enable row level security;
alter table public.events              enable row level security;
alter table public.event_inventory     enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.payment_records     enable row level security;
alter table public.send_later_orders   enable row level security;
alter table public.audit_logs          enable row level security;

-- =================================================================
-- applications
-- =================================================================
drop policy if exists applications_anon_insert     on public.applications;
drop policy if exists applications_admin_select    on public.applications;
drop policy if exists applications_admin_update    on public.applications;

create policy applications_anon_insert
  on public.applications for insert
  to anon, authenticated
  with check (true);

create policy applications_admin_select
  on public.applications for select
  to authenticated
  using (public.is_admin());

create policy applications_admin_update
  on public.applications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =================================================================
-- admin_users
-- =================================================================
drop policy if exists admin_users_self_or_admin_select on public.admin_users;
drop policy if exists admin_users_admin_insert         on public.admin_users;
drop policy if exists admin_users_admin_delete         on public.admin_users;

create policy admin_users_self_or_admin_select
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy admin_users_admin_insert
  on public.admin_users for insert
  to authenticated
  with check (public.is_admin());

create policy admin_users_admin_delete
  on public.admin_users for delete
  to authenticated
  using (public.is_admin());

-- =================================================================
-- invite_codes (admin manage; redemption is via security-definer RPC)
-- =================================================================
drop policy if exists invite_codes_admin_select on public.invite_codes;
drop policy if exists invite_codes_admin_insert on public.invite_codes;
drop policy if exists invite_codes_admin_update on public.invite_codes;

create policy invite_codes_admin_select
  on public.invite_codes for select
  to authenticated
  using (public.is_admin());

create policy invite_codes_admin_insert
  on public.invite_codes for insert
  to authenticated
  with check (public.is_admin());

create policy invite_codes_admin_update
  on public.invite_codes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =================================================================
-- workspaces
-- =================================================================
drop policy if exists workspaces_member_select on public.workspaces;
drop policy if exists workspaces_owner_update  on public.workspaces;

create policy workspaces_member_select
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id) or public.is_admin());

create policy workspaces_owner_update
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_member(id, array['owner']))
  with check (public.is_workspace_member(id, array['owner']));

-- INSERT happens only via redeem_invite_code() (security definer); no direct policy.

-- =================================================================
-- workspace_members
-- =================================================================
drop policy if exists workspace_members_self_or_member_select on public.workspace_members;
drop policy if exists workspace_members_owner_manager_insert  on public.workspace_members;
drop policy if exists workspace_members_owner_manager_update  on public.workspace_members;
drop policy if exists workspace_members_owner_delete          on public.workspace_members;

create policy workspace_members_self_or_member_select
  on public.workspace_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_workspace_member(workspace_id)
    or public.is_admin()
  );

create policy workspace_members_owner_manager_insert
  on public.workspace_members for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, array['owner','manager']));

create policy workspace_members_owner_manager_update
  on public.workspace_members for update
  to authenticated
  using (public.is_workspace_member(workspace_id, array['owner','manager']))
  with check (public.is_workspace_member(workspace_id, array['owner','manager']));

create policy workspace_members_owner_delete
  on public.workspace_members for delete
  to authenticated
  using (public.is_workspace_member(workspace_id, array['owner']));

-- =================================================================
-- products (workspace-scoped CRUD; soft-delete via is_active)
-- =================================================================
drop policy if exists products_member_select on public.products;
drop policy if exists products_member_insert on public.products;
drop policy if exists products_member_update on public.products;

create policy products_member_select
  on public.products for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy products_member_insert
  on public.products for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, array['owner','manager','stock_staff']));

create policy products_member_update
  on public.products for update
  to authenticated
  using (public.is_workspace_member(workspace_id, array['owner','manager','stock_staff']))
  with check (public.is_workspace_member(workspace_id, array['owner','manager','stock_staff']));

-- =================================================================
-- events
-- =================================================================
drop policy if exists events_member_select         on public.events;
drop policy if exists events_owner_manager_insert  on public.events;
drop policy if exists events_owner_manager_update  on public.events;

create policy events_member_select
  on public.events for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy events_owner_manager_insert
  on public.events for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, array['owner','manager']));

create policy events_owner_manager_update
  on public.events for update
  to authenticated
  using (public.is_workspace_member(workspace_id, array['owner','manager']))
  with check (public.is_workspace_member(workspace_id, array['owner','manager']));

-- =================================================================
-- event_inventory
-- =================================================================
drop policy if exists event_inventory_member_select       on public.event_inventory;
drop policy if exists event_inventory_stock_owner_insert  on public.event_inventory;
drop policy if exists event_inventory_stock_owner_update  on public.event_inventory;

create policy event_inventory_member_select
  on public.event_inventory for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy event_inventory_stock_owner_insert
  on public.event_inventory for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, array['owner','manager','stock_staff']));

create policy event_inventory_stock_owner_update
  on public.event_inventory for update
  to authenticated
  using (public.is_workspace_member(workspace_id, array['owner','manager','stock_staff']))
  with check (public.is_workspace_member(workspace_id, array['owner','manager','stock_staff']));

-- =================================================================
-- orders / order_items / payment_records
-- SELECT visible to workspace members.
-- INSERT/UPDATE only via security-definer RPCs (create_order, void_order, correct_order)
-- which are added in later batches and bypass RLS by definition.
-- =================================================================
drop policy if exists orders_member_select          on public.orders;
drop policy if exists order_items_member_select     on public.order_items;
drop policy if exists payment_records_member_select on public.payment_records;

create policy orders_member_select
  on public.orders for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy order_items_member_select
  on public.order_items for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy payment_records_member_select
  on public.payment_records for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

-- =================================================================
-- send_later_orders (members can view; status updates by owner/manager)
-- =================================================================
drop policy if exists send_later_orders_member_select          on public.send_later_orders;
drop policy if exists send_later_orders_owner_manager_update   on public.send_later_orders;

create policy send_later_orders_member_select
  on public.send_later_orders for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy send_later_orders_owner_manager_update
  on public.send_later_orders for update
  to authenticated
  using (public.is_workspace_member(workspace_id, array['owner','manager']))
  with check (public.is_workspace_member(workspace_id, array['owner','manager']));

-- =================================================================
-- audit_logs
-- =================================================================
drop policy if exists audit_logs_member_or_admin_select on public.audit_logs;

create policy audit_logs_member_or_admin_select
  on public.audit_logs for select
  to authenticated
  using (
    (workspace_id is null and public.is_admin())
    or (workspace_id is not null and (public.is_workspace_member(workspace_id) or public.is_admin()))
  );

-- =================================================================
-- customers / customer_contacts / pets / customer_order_links
-- (Wave 40a — Customer Portal)
--
-- Reads: workspace members + platform admins.
-- Writes: only the SECURITY DEFINER RPCs (claim_registration_token,
-- and future cashier-side helpers in Wave 40b/c). No direct writes
-- from authenticated clients; the RPCs handle everything atomically
-- and audit-log every mutation.
-- =================================================================
alter table if exists public.customers              enable row level security;
alter table if exists public.customer_contacts      enable row level security;
alter table if exists public.pets                   enable row level security;
alter table if exists public.customer_order_links   enable row level security;
alter table if exists public.customer_registration_tokens enable row level security;
alter table if exists public.close_day_records          enable row level security;
alter table if exists public.order_refunds              enable row level security;

drop policy if exists customers_member_select            on public.customers;
drop policy if exists customer_contacts_member_select    on public.customer_contacts;
drop policy if exists pets_member_select                 on public.pets;
drop policy if exists customer_order_links_member_select on public.customer_order_links;

create policy customers_member_select
  on public.customers for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy customer_contacts_member_select
  on public.customer_contacts for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy pets_member_select
  on public.pets for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

create policy customer_order_links_member_select
  on public.customer_order_links for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

-- =================================================================
-- customer_registration_tokens
--
-- Reads: workspace members can see their own tokens (so the cashier
-- can list issued tokens, see which were claimed). The anon claim
-- flow does NOT need RLS read — the SECURITY DEFINER RPC validates
-- the token and bypasses RLS. Tokens are NEVER exposed to anon SELECT.
-- =================================================================
drop policy if exists customer_reg_tokens_member_select on public.customer_registration_tokens;

create policy customer_reg_tokens_member_select
  on public.customer_registration_tokens for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

-- =================================================================
-- close_day_records
--
-- Reads: workspace members can view close-day history. Writes go ONLY through
-- the close_day SECURITY DEFINER RPC (which also writes the audit row), so there
-- is no insert/update/delete policy.
-- =================================================================
drop policy if exists close_day_records_member_select on public.close_day_records;

create policy close_day_records_member_select
  on public.close_day_records for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());

-- =================================================================
-- order_refunds
--
-- Reads: workspace members can view refunds. Writes go ONLY through the
-- refund_order_items SECURITY DEFINER RPC (which restores stock + writes the
-- audit row), so there is no insert/update/delete policy.
-- =================================================================
drop policy if exists order_refunds_member_select on public.order_refunds;

create policy order_refunds_member_select
  on public.order_refunds for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());
