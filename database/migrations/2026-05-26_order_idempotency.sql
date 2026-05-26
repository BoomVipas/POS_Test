-- Forward migration: add a client-generated idempotency key to orders so a
-- retry of create_order after a lost/timed-out response (flaky booth wifi)
-- replays to the same order instead of creating a duplicate sale.
--
-- schema.sql is the source of truth and already includes this; run this only to
-- move an EXISTING database forward. Safe to re-run (idempotent).

alter table public.orders
  add column if not exists client_request_id uuid;

create unique index if not exists orders_client_request_idx
  on public.orders (workspace_id, client_request_id)
  where client_request_id is not null;
