-- Forward migration: end-of-day cash reconciliation records (DD-92).
-- schema.sql is the source of truth and already includes this; run this only to
-- move an EXISTING database forward. Safe to re-run. The close_day RPC
-- (database/functions/close_day.sql) must also be applied.

create table if not exists public.close_day_records (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  iso_date             date not null,
  expected_cash_satang bigint not null default 0,
  counted_cash_satang  bigint not null default 0,
  discrepancy_satang   bigint not null default 0,
  reason               text,
  closed_by_user_id    uuid references auth.users(id),
  created_at           timestamptz not null default now()
);
create index if not exists close_day_workspace_date_idx
  on public.close_day_records (workspace_id, iso_date desc, created_at desc);

alter table public.close_day_records enable row level security;

drop policy if exists close_day_records_member_select on public.close_day_records;
create policy close_day_records_member_select
  on public.close_day_records for select
  to authenticated
  using (public.is_workspace_member(workspace_id) or public.is_admin());
