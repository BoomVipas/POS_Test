# Glossary

Terms that show up in code, UI, and PR descriptions. Use these consistently.

## Domain

- **Application** — a row in `applications`. Someone who filled the public `/apply` form. Pre-auth, no workspace.
- **Invite code** — a one-shot signup token (`CATBOOTH-XXXX-YYYY`) tied to one approved application. Issued by an admin, expires in 14 days, single-use.
- **Workspace** — one brand's data tenant. The `workspace_id` on every business table is the isolation boundary.
- **Workspace member** — a user with a role inside a workspace. Roles: `owner`, `manager`, `cashier`, `stock_staff`, `viewer`.
- **Admin** — a row in `admin_users`. Platform admin; can moderate applications, view all workspaces. Different from a workspace owner.
- **Event** — one booth or fair (e.g. "Pet Expo 2026"). Belongs to a workspace. Has `start_date`, `end_date`, `status`.
- **Event inventory** — per-product stock at an event. Tracks `starting_qty`, `current_qty`, `reserved_qty`, `sold_qty`, `adjusted_qty`.
- **Order** — a customer transaction. Has `order_number` like `event_017` (per-event sequence). Header table; line items live in `order_items`.
- **Order item** — one SKU sold within an order. Has `fulfillment_type` (`take_now` or `send_later`).
- **Order type** — derived from items: `take_now`, `send_later`, `mixed`, or `sample`.
- **Payment record** — a payment event for an order. Multiple records can exist for split payments (cash + transfer, etc.).
- **Send-later order** — fulfilment data for an order that ships later. Tracks `fulfillment_status` from `pending` → `packed` → `shipped` → `completed`.
- **Sample bucket** — `event_inventory.sample_qty` (Wave 39a). Units physically on display at the booth. Moved between booth and sample via the `convert_event_to_sample` / `convert_sample_to_event` RPCs. Reduces sellable booth stock but never auto-returns to warehouse.
- **Customer Portal** — the customer-facing layer at `/register/[token]` where pet owners claim a post-purchase profile (Wave 40b). Separate from the cashier flow by design — checkout stays fast, profile capture is post-purchase.
- **Registration token** — a 16-char single-use string with 90-day expiry. Issued by `create_registration_token` at sale completion (Wave 40a); redeemed once by the customer through `claim_registration_token`. The token IS the credential for the anon claim flow.
- **Audit log** — append-only row written for every admin action, every order mutation, every correction. Never deleted.

## Technical

- **RLS** — Row Level Security. Postgres feature where every SELECT/INSERT/UPDATE/DELETE has policy checks. We use it as the multi-tenant boundary.
- **RPC** — Postgres Remote Procedure Call. We use security-definer functions for atomic mutations. As of Wave 40a there are 8: sales (`create_order`, `void_order`, `correct_order`), onboarding (`redeem_invite_code`), sample bucket Wave 39a (`convert_event_to_sample`, `convert_sample_to_event`), customer portal Wave 40a (`create_registration_token` workspace-only, `claim_registration_token` anon-callable).
- **Service role** — Supabase's all-powerful key. Bypasses RLS. Server-only. Never `NEXT_PUBLIC_*`. Never imported by client components.
- **Anon key** — Supabase's public key. Subject to RLS. Safe in the browser bundle.
- **Server action** — Next.js function with `"use server"`. Runs on the server; can be called from client components like a regular async function.
- **Force-dynamic** — Next.js opt-out of static prerendering. Used on auth-gated layouts so the gate runs per request.
- **Satang** — 1/100 of a Thai baht. All money in this codebase is `bigint` satang. 1 baht = 100 satang.

## UI

- **Panel** — large rounded card with cream gradient + soft shadow. The visual base unit.
- **Pill / Chip** — small rounded label, used for status (active, sold out, send later).
- **Demo mode** — yellow badge shown when Supabase is not configured. Renders mock data.
- **Sticky cart** — the right-side cart panel on desktop / bottom drawer on mobile.

## Workflow

- **DD-XXX** — batch identifier in this project. `DD-001..100` was the original plan; `DD-101..200` is Vol 2.
- **Phase** — a group of related batches (Foundation, Public Application Flow, Admin Approval, etc.). See `docs/BATCH_PLAN.md`.
- **Wave** — a sub-grouping within a single sprint, used in Vol 2 commit messages.
- **Pilot** — the first 5 cat-product brands using the system. Free, manually approved, monitored closely.
