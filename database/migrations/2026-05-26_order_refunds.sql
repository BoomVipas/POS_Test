-- Forward migration: per-line partial refunds (Wave 48).
-- schema.sql is the source of truth and already includes this; run this only to
-- move an EXISTING database forward. Safe to re-run. The refund_order_items RPC
-- (database/functions/refund_order_items.sql) must also be applied.

create table if not exists public.order_refunds (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  order_id            uuid not null references public.orders(id) on delete cascade,
  order_item_id       uuid not null references public.order_items(id) on delete cascade,
  qty                 int not null check (qty > 0),
  amount_satang       bigint not null check (amount_satang >= 0),
  reason              text,
  refunded_by_user_id uuid references auth.users(id),
  created_at          timestamptz not null default now()
);
create index if not exists order_refunds_order_idx on public.order_refunds (workspace_id, order_id);
create index if not exists order_refunds_item_idx  on public.order_refunds (order_item_id);

alter table public.order_refunds enable row level security;

drop policy if exists order_refunds_member_select on public.order_refunds;
create policy order_refunds_member_select
  on public.order_refunds for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());
