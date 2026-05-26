-- pos-for-sell SaaS schema
-- Money is stored as bigint THB satang (1 THB = 100 satang).
-- All ids are uuid (gen_random_uuid).
-- Multi-tenant: every business table has workspace_id (RLS enforces isolation; see rls-policies.sql).
--
-- Run order: schema.sql → rls-policies.sql → seed.sql (dev only).

create extension if not exists "pgcrypto";  -- for gen_random_uuid

-- =================================================================
-- 1. applications (public form, no workspace_id, anon-insertable)
-- =================================================================
create table if not exists public.applications (
  id                uuid primary key default gen_random_uuid(),
  owner_name        text not null,
  phone             text not null,
  email             text not null,
  brand_name        text not null,
  product_category  text not null,
  social_link       text,
  num_skus          int,
  events_per_year   int,
  message           text,
  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected','invited','registered')),
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid references auth.users(id),
  unique (email)
);
create index if not exists applications_status_idx on public.applications (status, created_at desc);

-- =================================================================
-- 2. admin_users (platform admins; separate from workspace owners)
-- =================================================================
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references auth.users(id)
);

-- =================================================================
-- 3. invite_codes
-- =================================================================
create table if not exists public.invite_codes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  code            text not null unique,
  email           text not null,
  brand_name      text not null,
  status          text not null default 'active'
                    check (status in ('active','used','expired','cancelled')),
  expires_at      timestamptz not null default (now() + interval '14 days'),
  used_at         timestamptz,
  used_by_user_id uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists invite_codes_status_idx on public.invite_codes (status, expires_at);

-- =================================================================
-- 4. workspaces (the tenancy boundary)
-- =================================================================
create table if not exists public.workspaces (
  id              uuid primary key default gen_random_uuid(),
  brand_name      text not null,
  slug            text not null unique,
  owner_user_id   uuid not null references auth.users(id),
  industry        text not null default 'cat_product',
  status          text not null default 'active'
                    check (status in ('active','suspended','archived')),
  setup_complete  boolean not null default false,
  created_at      timestamptz not null default now()
);

-- =================================================================
-- 5. workspace_members
-- =================================================================
create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null
                  check (role in ('owner','manager','cashier','stock_staff','viewer')),
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists workspace_members_user_idx on public.workspace_members (user_id);

-- =================================================================
-- Helper functions used by RLS policies and RPCs
-- =================================================================
create or replace function public.is_workspace_member(
  ws    uuid,
  roles text[] default array['owner','manager','cashier','stock_staff','viewer']
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws
      and wm.user_id = auth.uid()
      and wm.role = any (roles)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  );
$$;

-- =================================================================
-- 6. products
-- =================================================================
create table if not exists public.products (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  sku                   text not null,
  name                  text not null,
  category              text not null default 'uncategorized',
  price_satang          bigint not null check (price_satang >= 0),
  shipping_fee_satang   bigint not null default 0 check (shipping_fee_satang >= 0),
  default_starting_qty  int  not null default 0 check (default_starting_qty >= 0),
  send_later_enabled    boolean not null default true,
  is_active             boolean not null default true,
  image_path            text,
  note                  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (workspace_id, sku)
);
create index if not exists products_workspace_active_idx on public.products (workspace_id, is_active);

-- =================================================================
-- 7. events
-- =================================================================
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  venue        text,
  start_date   date not null,
  end_date     date not null,
  status       text not null default 'planned'
                 check (status in ('planned','running','closed','archived')),
  created_at   timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists events_workspace_status_idx on public.events (workspace_id, status);

-- =================================================================
-- 8. event_inventory
-- =================================================================
create table if not exists public.event_inventory (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  event_id      uuid not null references public.events(id) on delete cascade,
  product_id    uuid not null references public.products(id),
  starting_qty  int not null default 0 check (starting_qty >= 0),
  current_qty   int not null default 0 check (current_qty >= 0),
  reserved_qty  int not null default 0 check (reserved_qty >= 0),
  sold_qty      int not null default 0 check (sold_qty >= 0),
  sample_qty    int not null default 0 check (sample_qty >= 0),
  adjusted_qty  int not null default 0,
  updated_at    timestamptz not null default now(),
  unique (event_id, product_id)
);
create index if not exists event_inventory_event_idx on public.event_inventory (event_id);

-- =================================================================
-- 9. orders
-- =================================================================
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  event_id            uuid not null references public.events(id),
  order_number        text not null,
  cashier_user_id     uuid references auth.users(id),
  customer_name       text,
  customer_phone      text,
  customer_email      text,
  order_type          text not null default 'take_now'
                        check (order_type in ('take_now','send_later','mixed','sample')),
  payment_method      text not null
                        check (payment_method in ('cash','promptpay','transfer','card','other','sample','mixed')),
  payment_status      text not null default 'paid'
                        check (payment_status in ('paid','pending','failed','refunded','voided')),
  subtotal_satang     bigint not null default 0 check (subtotal_satang >= 0),
  discount_satang     bigint not null default 0 check (discount_satang >= 0),
  shipping_fee_satang bigint not null default 0 check (shipping_fee_satang >= 0),
  total_satang        bigint not null default 0 check (total_satang >= 0),
  status              text not null default 'completed'
                        check (status in ('completed','voided','corrected')),
  note                text,
  created_at          timestamptz not null default now(),
  voided_at           timestamptz,
  voided_by_user_id   uuid references auth.users(id),
  void_reason         text,
  -- Idempotency key (client-generated per confirm attempt). A retry after a
  -- lost/timed-out create_order response replays with the same id so the sale is
  -- recorded once. NULL for orders created before this column / without a key.
  client_request_id   uuid,
  unique (event_id, order_number)
);
create index if not exists orders_workspace_event_idx on public.orders (workspace_id, event_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create unique index if not exists orders_client_request_idx
  on public.orders (workspace_id, client_request_id)
  where client_request_id is not null;

-- =================================================================
-- 10. order_items
-- =================================================================
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid not null references public.products(id),
  sku               text not null,
  product_name      text not null,
  qty               int not null check (qty > 0),
  unit_price_satang bigint not null check (unit_price_satang >= 0),
  line_total_satang bigint not null check (line_total_satang >= 0),
  fulfillment_type  text not null default 'take_now'
                      check (fulfillment_type in ('take_now','send_later')),
  is_sample         boolean not null default false,
  note              text,
  created_at        timestamptz not null default now()
);
create index if not exists order_items_order_idx   on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- =================================================================
-- 11. payment_records
-- =================================================================
create table if not exists public.payment_records (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  order_id        uuid not null references public.orders(id) on delete cascade,
  payment_method  text not null
                    check (payment_method in ('cash','promptpay','transfer','card','other')),
  amount_satang   bigint not null check (amount_satang >= 0),
  slip_path       text,
  confirmed_by    uuid references auth.users(id),
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists payment_records_order_idx on public.payment_records (order_id);

-- =================================================================
-- 12. send_later_orders
-- =================================================================
create table if not exists public.send_later_orders (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  order_id            uuid not null references public.orders(id) on delete cascade,
  customer_name       text not null,
  customer_phone      text not null,
  shipping_address    text not null,
  shipping_method     text,
  shipping_fee_satang bigint not null default 0,
  fulfillment_status  text not null default 'pending'
                        check (fulfillment_status in ('pending','packed','shipped','completed','cancelled')),
  tracking_number     text,
  note                text,
  created_at          timestamptz not null default now(),
  packed_at           timestamptz,
  shipped_at          timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz
);
create index if not exists send_later_status_idx on public.send_later_orders (workspace_id, fulfillment_status);

-- =================================================================
-- 12b. close_day_records (end-of-day cash reconciliation; written via the
--      close_day RPC, which also writes the audit row)
-- =================================================================
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

-- =================================================================
-- 12c. order_refunds (per-line partial refunds; written via the
--      refund_order_items RPC, which also restores stock + writes the audit row)
-- =================================================================
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

-- =================================================================
-- 13. audit_logs (append-only; mutations happen via RPCs that insert here)
-- =================================================================
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references public.workspaces(id) on delete set null,
  user_id       uuid references auth.users(id),
  action        text not null,
  target_table  text not null,
  target_id     uuid,
  old_value     jsonb,
  new_value     jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists audit_logs_workspace_idx on public.audit_logs (workspace_id, created_at desc);
create index if not exists audit_logs_target_idx    on public.audit_logs (target_table, target_id);

-- =================================================================
-- 14. customers (Wave 40a — Customer Portal)
-- =================================================================
-- Per-workspace customer profile. Created via the post-purchase Customer
-- Portal (anon claim flow), never required by the cashier checkout. The
-- `registered_via` field records how the row was created so we can
-- distinguish portal self-registration from cashier-side quick-tag.
create table if not exists public.customers (
  id                       uuid primary key default gen_random_uuid(),
  workspace_id             uuid not null references public.workspaces(id) on delete cascade,
  display_name             text,
  preferred_contact_method text check (preferred_contact_method in ('phone','email','line')),
  consent_marketing        boolean not null default false,
  consent_marketing_at     timestamptz,
  registered_via           text not null default 'portal'
                             check (registered_via in ('portal','cashier','admin','import')),
  first_seen_at            timestamptz not null default now(),
  last_seen_at             timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists customers_workspace_idx on public.customers (workspace_id, last_seen_at desc);

-- =================================================================
-- 15. customer_contacts (Wave 40a)
-- =================================================================
-- Multiple channels per customer (phone / email / line / other). Repeat-
-- customer lookup at the next event uses (workspace_id, channel, value).
create table if not exists public.customer_contacts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  channel       text not null check (channel in ('phone','email','line','other')),
  value         text not null check (length(value) > 0),
  is_primary    boolean not null default false,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (workspace_id, channel, value)
);
create index if not exists customer_contacts_customer_idx on public.customer_contacts (customer_id);
create index if not exists customer_contacts_lookup_idx
  on public.customer_contacts (workspace_id, channel, value);

-- =================================================================
-- 16. pets (Wave 40a — vertical module)
-- =================================================================
-- Pet profile attached to a customer. Optional even within the portal —
-- some customers register only their own contact info. The pet module is
-- a vertical layer; non-pet workspaces will simply have no rows here.
create table if not exists public.pets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  name          text not null,
  species       text not null default 'cat'
                  check (species in ('cat','dog','rabbit','bird','other')),
  breed         text,
  weight_kg     numeric(5,2),
  birthday      date,
  adoption_day  date,
  allergies     text,
  preferences   text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists pets_customer_idx on public.pets (customer_id);

-- =================================================================
-- 17. customer_order_links (Wave 40a)
-- =================================================================
-- Many-to-many bridge between customers and orders. Populated when a
-- customer claims a registration token (one row per claim) and also when
-- a cashier explicitly attaches a returning customer to a sale.
create table if not exists public.customer_order_links (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  order_id      uuid not null references public.orders(id) on delete cascade,
  linked_via    text not null default 'portal'
                  check (linked_via in ('portal','cashier','admin')),
  linked_at     timestamptz not null default now(),
  unique (customer_id, order_id)
);
create index if not exists customer_order_links_customer_idx on public.customer_order_links (customer_id);
create index if not exists customer_order_links_order_idx    on public.customer_order_links (order_id);

-- =================================================================
-- 18. customer_registration_tokens (Wave 40a)
-- =================================================================
-- One-shot token created when a sale is completed. The cashier shows the
-- QR / link to the customer; the customer scans, lands on the portal, and
-- submits the form which calls `claim_registration_token`. Tokens expire
-- after 90 days and are single-use.
create table if not exists public.customer_registration_tokens (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  order_id            uuid not null references public.orders(id) on delete cascade,
  token               text not null unique,
  expires_at          timestamptz not null default (now() + interval '90 days'),
  claimed_at          timestamptz,
  claimed_customer_id uuid references public.customers(id) on delete set null,
  created_at          timestamptz not null default now(),
  created_by_user_id  uuid references auth.users(id)
);
create index if not exists customer_reg_tokens_order_idx     on public.customer_registration_tokens (order_id);
create index if not exists customer_reg_tokens_workspace_idx on public.customer_registration_tokens (workspace_id, created_at desc);

-- =================================================================
-- updated_at triggers
-- =================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists event_inventory_touch on public.event_inventory;
create trigger event_inventory_touch
  before update on public.event_inventory
  for each row execute function public.touch_updated_at();

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch
  before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists pets_touch on public.pets;
create trigger pets_touch
  before update on public.pets
  for each row execute function public.touch_updated_at();
