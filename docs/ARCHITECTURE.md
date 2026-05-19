# Architecture

## Stack

- **Next.js 16 (App Router, src/)** — server-first React. Public pages prerender; auth-gated layouts force-dynamic.
- **React 19** + **TypeScript 5** + **Tailwind CSS 4** (`@theme inline` tokens carrying meowmeow palette).
- **Supabase** — Postgres + Auth + Storage + Row Level Security. Service role key is server-only.
- **Resend** — transactional email. Wrapper at `src/lib/email/resend.ts`.
- **Vercel** — hosting. Root directory: `pos-for-sell/`.
- **npm**.
- **Vitest** for unit tests on pure-logic libs.

## Data flow

```
public visitor               admin                pilot client
       |                       |                        |
       v                       v                        v
   /apply form         /admin/applications        /register (invite-code)
       |                  approve / reject              |
       |                       |                        v
       v                       v                  /app/setup/products
  applications row     invite_codes row                 |
       |                       |                        v
       |               email via Resend             /app/pos
       |                       |                        |
       v                       |              create_order RPC (atomic)
   admin notif via Resend      v                        |
                          customer email          orders + order_items
                                                  + payment_records
                                                  + send_later_orders (if any)
                                                  + audit_logs
                                                  + event_inventory decrement
```

## Key boundaries

- **Server vs client**. Default is server components. `"use client"` only when interactivity needs it (forms, cart store, modal).
- **Mutations vs reads**. Server actions for app-internal mutations. Postgres `security definer` functions for atomic, multi-table writes — 8 RPCs as of Wave 40a (verified 2026-05-18): sales (`create_order`, `void_order`, `correct_order`), onboarding (`redeem_invite_code`), sample bucket Wave 39a (`convert_event_to_sample`, `convert_sample_to_event`), customer portal Wave 40a (`create_registration_token` workspace-only, `claim_registration_token` anon-callable). RLS allows direct INSERT/UPDATE for products/events/inventory by role; orders+order_items+payment_records have **no direct mutation policy** — they go through RPCs. Customer-portal tables likewise have no direct write policy — all writes go through `claim_registration_token`.
- **Admin vs tenant**. `/admin/*` requires a row in `admin_users` (checked in `src/lib/auth/admin-check.ts`). `/app/*` requires a row in `workspace_members` for the user's workspace. Public + auth pages have no gate.

## Tenancy

Every business table has `workspace_id`. RLS policies in `database/rls-policies.sql` enforce isolation: a workspace member sees only their workspace's rows. Server actions never use the service role for tenant data; they use the user's session. The service role is reserved for admin-side operations like creating invite codes.

## Money

All money is stored as `bigint` THB satang (1 THB = 100 satang). UI formats via `src/lib/money/format.ts`. Never use floats for money math.

## Inventory atomicity

`create_order` acquires `FOR UPDATE` on each `event_inventory` row before validating qty. Two cashiers cannot oversell the same SKU.

## Why a single Supabase project for all tenants

For the 5-brand pilot, one Postgres + RLS gives:

- Cheaper to operate (one DB, one Auth).
- Easier to audit (one schema, one set of policies).
- Multi-tenant separation provided by RLS policies + helper functions.
- Migration path to per-tenant DB is open (RLS makes that more annoying than helpful at this scale).

If/when the pilot graduates to a paid product, larger tenants can be migrated to dedicated projects.

## Two-layer architecture: POS App + Customer Portal (added 2026-05-07)

Per [VISION.md](../../VISION.md) and [PROJECT_VISION.md](PROJECT_VISION.md), MochiPOS is split into two connected layers so the cashier never has to do CRM work during peak sales time.

### Layer A — POS App (seller-facing)

- Routes under `/app/*`, gated by `workspace_members` membership.
- Used by cashier and staff during the event.
- Optimised for speed, low typing, mistake resistance.
- Required-to-save fields: product, qty, payment method, fulfillment (take-now / Send Later), discount.
- Customer fields are optional even within the Send Later flow (the only place `CustomerInfoBlock` renders).
- **Pet UI never appears in this layer.** The `useDemoPets` / `PetCardsBlock` from Wave 35 are scheduled for removal — Waves 40b/c shipped 2026-05-07 (which made the in-cashier pet UI redundant), but the cleanup batch hasn't been scheduled yet. Until then, treat the rule as authoritative and don't extend that code path.

### Layer B — Customer Portal (customer-facing)

- Routes under `/register/[token]` (anon, no auth session).
- Reached via QR on receipt or shareable link (Line / SMS / email).
- Mobile-first, bilingual EN/TH.
- Data writes go through `claim_registration_token` SECURITY DEFINER RPC. The token IS the credential; without it, the function aborts.
- Captures customer profile + multi-channel contacts + (optional) pet profile + order linking — atomically, in one transaction, audit-logged.

### Why the layers are connected by a token, not auth

Customers don't have a Supabase auth session at the booth. Forcing a signup before they can claim "this was my order" would defeat the speed goal. A 16-char single-use 90-day-expiring token solves this: the cashier issues it as part of the sale, the customer redeems it from any device. Two different physical people, two different sessions, one shared opaque secret.

### Data isolation between layers

- All five Customer Portal tables (`customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`) carry `workspace_id` and have RLS read policies for workspace members + admins.
- **No direct INSERT / UPDATE / DELETE policies exist on these tables.** Every mutation goes through a SECURITY DEFINER RPC (`claim_registration_token` for the anon flow; future cashier-side helpers in Wave 40c).
- This means the anon Supabase key cannot write to the database directly — only the RPC, which validates the token first.

### Vertical module flag

The `pets` table is a vertical module. Non-pet workspaces will have empty `pets` rows; UI must handle this case (planned for Wave 40b). The architecture is **general POS core + optional vertical modules**; the pet module is the booth-seller moat for the pilot, but the core works without it.
