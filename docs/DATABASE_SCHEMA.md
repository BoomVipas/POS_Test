# Database Schema (overview)

Source of truth: `database/schema.sql`. RLS in `database/rls-policies.sql`. Seed data in `database/seed.sql`.

## Tables

### Tenant + identity

1. **applications** — public form submissions (pre-auth). No workspace_id.
2. **invite_codes** — one-shot signup tokens linked to an approved application.
3. **workspaces** — one per pilot client. The tenancy boundary.
4. **workspace_members** — link `auth.users.id` ↔ `workspaces.id` with a role.
5. **admin_users** — explicit allowlist of platform admins (separate from workspace owners).

### Catalog

6. **products** — product cards. Belongs to a workspace. Image stored in Supabase Storage; row holds `image_path`. Category is inlined as a `text` column (`category not null default 'uncategorized'`) — no separate `categories` table.

### Selling

7. **events** — one booth/fair. Workspace-scoped. Has start_date, end_date, status.
8. **event_inventory** — per-product stock at an event. Has starting_qty, current_qty, reserved_qty (for send-later), sold_qty, **sample_qty** (event-long display bucket; Wave 39a), adjusted_qty. Sample units are physically on display at the booth: they reduce sellable booth stock (`current_qty`) but never return to warehouse on their own. Move units between booth and sample with the `convert_event_to_sample` and `convert_sample_to_event` RPCs.
9. **orders** — sale header. Has total, payment_method, payment_status, customer info, order_type (take_now / send_later / mixed).
10. **order_items** — one row per SKU sold. Has fulfillment_type per line.
11. **payment_records** — payment events for an order (multiple payments allowed, e.g. partial cash + transfer).
12. **send_later_orders** — fulfillment data when one or more items are send_later.

### Trust + audit

13. **audit_logs** — append-only. Action + table + before/after JSON snapshots.

### Customer Portal (Wave 40a — post-purchase, customer-facing)

The pet/customer profile system is **never** part of the cashier checkout flow. It is captured after the sale via a QR / link on the receipt that opens a customer-facing registration page. See [VISION.md](../../VISION.md) and [PROJECT_VISION.md](PROJECT_VISION.md) for the strategic rationale.

14. **customers** — workspace-scoped customer profile. Created via the portal claim flow or by an explicit cashier-side tag. `registered_via` records origin (portal / cashier / admin / import).
15. **customer_contacts** — multi-channel contact rows per customer (phone / email / line / other). Unique on `(workspace_id, channel, value)` so repeat lookups can match without duplicates.
16. **pets** — pet profiles per customer (vertical module, optional even within the portal). Holds species, breed, weight, birthday/adoption day, allergies, preferences.
17. **customer_order_links** — many-to-many bridge between customers and orders. Populated on portal claim and on cashier-side returning-customer attach.
18. **customer_registration_tokens** — one-shot tokens (16-char base32-style). Created when a sale is completed; consumed once when the customer claims via the portal. 90-day default expiry.

**Total: 18 tables** (5 tenant/identity + 1 catalog + 6 selling + 1 audit + 5 customer portal).

## Money

All money columns are `bigint` representing **THB satang** (1 THB = 100 satang). UI formats to "1,234.50 THB".

## Identifiers

- All primary keys are `uuid` defaulting to `gen_random_uuid()`.
- `workspaces.slug` is a human-readable URL slug, unique.
- `orders.order_number` is a human-readable per-event sequence (event_001, event_002, ...).
- `invite_codes.code` is `CATBOOTH-XXXX-YYYY` where X/Y are ambiguity-safe base32.

## RLS strategy

- **Public tables (`applications`)**: anyone can insert; only admins can select/update.
- **Auth-required, workspace-scoped (`products`, `events`, `event_inventory`, `orders`, `order_items`, `payment_records`, `send_later_orders`, `audit_logs`, `customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`)**: row visible only to members of the workspace via `workspace_members`. Direct writes are blocked on the customer/pet/portal tables — all mutations go through the SECURITY DEFINER RPCs (`claim_registration_token` for the anon portal flow; future cashier-side helpers in Waves 40b/c).
- **Identity tables (`workspaces`, `workspace_members`)**: a member can read their own workspace and its members. Insert is via server action with admin/owner check. Update is owner-only.
- **Admin tables (`invite_codes`, `admin_users`)**: only platform admins can read/write.

## Postgres functions (server-side, security definer)

- `create_order(payload jsonb) returns uuid` — atomic sale write. Acquires `FOR UPDATE` on each `event_inventory` row, validates qty, decrements, inserts orders+items+payments+audit, returns order_id. Caller must be a workspace member with role in (owner, manager, cashier).
- `void_order(order_id uuid, reason text) returns void` — inverse. Restores event_inventory, sets order.status = voided, writes audit row. Owner/manager only.
- `correct_order(order_id uuid, payload jsonb) returns void` — edit existing order; recomputes inventory delta vs original; writes audit.
- `redeem_invite_code(code text, password text, brand_name text) returns uuid` — code validation + signup + workspace creation, in one transaction. Returns workspace_id.
- `convert_event_to_sample(p_event_id uuid, p_product_id uuid, p_qty int, p_reason text default null) returns event_inventory` — atomically moves N units from `current_qty` into `sample_qty`. Refuses to underflow. Audit-logged. Roles: owner, manager, cashier, stock_staff. (Wave 39a)
- `convert_sample_to_event(p_event_id uuid, p_product_id uuid, p_qty int, p_reason text default null) returns event_inventory` — inverse. Moves N units from `sample_qty` back into `current_qty`. Same roles. (Wave 39a)
- `create_registration_token(p_order_id uuid) returns text` — issues a one-shot post-purchase token tied to an order. Roles: owner, manager, cashier. Returns the 16-char token used for the receipt QR / share link. Audit-logged. (Wave 40a)
- `claim_registration_token(p_token text, p_payload jsonb) returns uuid` — anon-callable. Validates the token (exists / not expired / not claimed), creates customer + contacts + pets + order link in one transaction, marks the token claimed. Returns the new customer_id. The token IS the credential — no auth session required. Audit-logged. (Wave 40a)

## Roles

| Role | Can do |
|---|---|
| `owner` | All workspace operations including delete |
| `manager` | All except delete workspace, can invite staff |
| `cashier` | Sell, view today's sales |
| `stock_staff` | Adjust stock, no sales |
| `viewer` | Read-only dashboard |

Pilot starts with only `owner` (one user per workspace). Other roles are reserved for post-pilot.

## Storage buckets

- `product-images` — public-read, write-restricted to workspace members. Path: `{workspace_id}/{product_id}/{filename}.webp`.
- `payment-slips` — private, signed URLs. Path: `{workspace_id}/{order_id}/{filename}.jpg`. (For transfer slip uploads.)
