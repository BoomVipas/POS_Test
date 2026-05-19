# Glossary — terms you'll see in MochiPOS

> Plain-language definitions, alphabetical. Each entry: 1-2 sentences + (when useful) the booth analogy and the file/table where it actually lives.
> Companion to [LEARNING.md](LEARNING.md). When you read a term you don't know, look it up here first.

---

## A

**Action (Server Action)** — A function that runs on the server but is called from a client component as if it were local. The framework handles the network call invisibly. *Anchor:* `src/app/apply/actions.ts` (the `submitApplication` function).

**Anon (anonymous) key** — The Supabase API key safe to ship to the browser. Limited by RLS so a leaked anon key cannot bypass tenant isolation. *Env var:* `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**App Router** — The Next.js convention where the URL path matches the folder path under `src/app/`. Replaces the older "pages" directory. *Anchor:* the whole `src/app/` tree.

**Async / await** — A way to write asynchronous code (waiting for a database, an email, etc.) that reads top-to-bottom. `await x()` means "pause here until `x` finishes." *Anchor:* every server component you've seen, e.g. `src/app/page.tsx`.

**Atomic** — All-or-nothing. Either every part of the action happens, or none of it. *Anchor:* `create_order` is atomic — if stock can't decrement, the order isn't inserted either.

**Audit log** — Append-only history of important actions. Even admins shouldn't be able to delete it. *Anchor:* `audit_logs` table; every important RPC writes a row.

**Auth (authentication)** — Verifying *who* someone is. *Anchor:* Supabase Auth — when a user logs in, every request gets a JWT token; the database reads it as `auth.uid()`.

**Authz (authorization)** — Deciding *what* someone is allowed to do. Different from auth. *Anchor:* `workspace_members.role` (`owner`, `cashier`, etc.) plus RLS policies.

---

## B

**Backend** — Code that runs on a server, never on the user's device. Does anything the browser can't be trusted with. *Booth:* the manager in the back room.

**`bigint`** — A 64-bit integer type in Postgres. Used for money in MochiPOS (stored as satang) so no float-precision bugs. *Anchor:* `products.price_satang bigint`.

**Branch (Git)** — A copy of the code you can edit without affecting the main version. *Anchor:* `pos/wave-41-...` etc.; `main` is the trunk.

**Build** — The process of compiling source code into production-ready JavaScript / HTML. *Command:* `npm run build`.

---

## C

**Cart store** — The React context + reducer holding the active sale: line items, qty, fulfillment type, payment method, discount, customer fields. Lives only while the cashier is mid-sale; clears on checkout or after idle timeout. *Anchor:* `src/lib/pos/cart-store.tsx`.

**Client component** — A React component that runs in the browser. Has `"use client"` on line 1. Can use `useState`, `onClick`, animations. *Anchor:* `src/app/apply/Form.tsx`.

**Commit (Git)** — One saved snapshot on a branch. *Command:* `git commit -m "..."`.

**Component** — A reusable piece of UI defined as a function that returns JSX. *Anchor:* `src/app/app/pos/ProductCard.tsx`.

**Cookie** — A small piece of data the browser stores and sends to the server with every request. Used for sessions/auth. *Anchor:* `src/lib/supabase/server.ts` reads/sets cookies for Supabase Auth.

**CRUD** — Create, Read, Update, Delete. The four basic operations on database rows.

**Customer Portal** — The customer-facing layer of MochiPOS where pet owners claim a profile after a sale (multi-channel contacts + optional pet info). Separate from the cashier app on purpose: checkout stays fast, profile capture is post-purchase. *Anchor:* `/register/[token]` route + `customers` / `customer_contacts` / `pets` / `customer_order_links` / `customer_registration_tokens` tables (Wave 40a/b). *Architecture rule:* "checkout first, profile later."

---

## D

**Database** — Long-term memory. Survives server restarts. *Anchor:* Supabase Postgres — see `database/schema.sql`. *Booth:* locked file cabinet.

**Demo mode** — MochiPOS's fallback when no Supabase is configured. State lives in localStorage instead of a real database. *Anchor:* everything under `src/lib/demo/`.

**Deploy** — Push code from your laptop to a server so the public can use it. *Anchor:* Vercel does this automatically when you merge to `main`.

**DevTools** — The browser's built-in debugger. Press F12. Most useful tabs: Elements (HTML), Console (JS messages), Network (frontend↔backend traffic), Application (cookies + localStorage).

**Dynamic route** — A URL where part of the path is a placeholder. *Anchor:* `src/app/register/[token]/page.tsx` → URLs like `/register/abc123`. The `[token]` is a parameter.

---

## E

**Edge function** — A small backend function deployed to many regions for low latency. MochiPOS doesn't use these yet.

**EMVCo** — The standards body for global payment QR codes. PromptPay QR codes follow the EMVCo Merchant-Presented Mode spec — which is why MochiPOS hand-builds the payload (TLV-encoded fields) plus a CRC16 checksum instead of using a generic QR library. *Anchor:* `src/lib/promptpay/`.

**Environment variable** — A piece of config (URL, secret) that's different per environment. Read via `process.env.NAME`. *Anchor:* `.env.local` on your laptop, Vercel project settings in production.

**ESLint** — The tool that flags bad/risky code patterns. Runs on `npm run lint`. *Anchor:* `eslint.config.mjs`.

**Event (in MochiPOS)** — One booth/fair, e.g. "Pet Expo Thailand 2026". *Anchor:* `events` table. Has `start_date`, `end_date`, `status`.

**Event inventory** — Per-product stock at one event. *Anchor:* `event_inventory` table. Has `current_qty`, `sample_qty`, `sold_qty`, etc.

---

## F

**Foreign key** — A column that points to another table's primary key, enforcing a relationship. *Anchor:* `products.workspace_id` references `workspaces.id`.

**Frontend** — The screen the user looks at and clicks. Runs in the browser. *Booth:* the cashier.

**Function (Postgres)** — Code that runs *inside the database*. Can do many things in one transaction. *Anchor:* `database/functions/create_order.sql`.

---

## G

**Git** — The version-control system. Tracks every change to the codebase. *Commands you'll use:* `git status`, `git checkout -b`, `git commit`, `git push`.

**GitHub** — The website where the Git repo lives so you and AI agents can push/pull. *Anchor:* `https://github.com/visanchan/meowmeow_sandbox`.

---

## H

**Honeypot** — A hidden form field that real users won't fill but bots will. If it's filled, the submission is silently rejected. *Anchor:* `website` field in `src/app/apply/Form.tsx` and the check in `actions.ts`.

**Hosting** — Where the app lives so anyone on the internet can reach it. *Anchor:* Vercel + Supabase.

**Hot reload** — When the dev server detects a code change and updates the browser without a manual refresh. *Anchor:* automatic with `npm run dev`.

---

## I

**i18n (internationalization)** — Making the app translate between languages. MochiPOS supports EN + TH. *Anchor:* `src/lib/i18n/dictionaries.ts`.

**Idempotent** — Running it twice has the same result as running it once. *Anchor:* migrations in `database/migrations/` use `if not exists` so they're idempotent.

**Invite code** — A one-shot code MochiPOS emails after admin approves an application. Used to redeem an account. *Anchor:* `invite_codes` table; redemption RPC `redeem_invite_code` in `database/functions/redeem_invite_code.sql`.

---

## J

**JSON** — A text format for data: `{"key": "value", "n": 123}`. The lingua franca of web APIs. *Anchor:* form values, RPC payloads, etc.

**JWT (JSON Web Token)** — A signed token proving a user is logged in. Sent with every Supabase request. The database reads it as `auth.uid()`.

---

## K

**Key (Supabase)** — Three Supabase keys: URL (project address), anon (public, RLS-restricted), service role (admin bypass — server only).

---

## L

**Layout** — A file that wraps every page underneath it in a folder. *Anchor:* `src/app/layout.tsx` (whole site), `src/app/app/layout.tsx` (every `/app/*` URL — adds nav + auth gate).

**localStorage** — Browser-side persistent storage. Survives page reloads but lives only on that device. *Anchor:* `src/lib/demo/*.ts` use it as a stand-in for a real database during demo mode.

**Lint** — Static analysis that flags risky patterns. *Command:* `npm run lint`.

---

## M

**Migration** — A SQL file that changes the database schema in a controlled, repeatable way. *Anchor:* `database/migrations/2026-05-07_*.sql`.

**Mock data** — Fake data used when real data is unavailable. *Anchor:* `src/app/app/pos/mock-data.ts`.

**Money (in MochiPOS)** — Stored as `bigint` representing **THB satang** (1 THB = 100 satang). Display formats to "1,234.50 THB".

**Multi-tenant** — One app serving many tenants (sellers/businesses) with strict isolation. *Anchor:* the `workspace_id` column on every business table.

---

## N

**Next.js** — The framework MochiPOS uses for everything: pages, routing, server actions, layouts. Built on React. *Version:* 16.

**`NEXT_PUBLIC_*`** — A prefix Next.js uses to indicate "this env var is safe to ship to the browser". Anything else is server-only.

---

## O

**Onboarding** — The first-time setup a new seller goes through after registering. Currently scaffolded but not wired.

**Order** — A sale header. *Anchor:* `orders` table.

**Order item** — One line on a sale. *Anchor:* `order_items` table — one row per SKU sold.

---

## P

**Page** — One URL = one `page.tsx` file. *Anchor:* `src/app/apply/page.tsx` → URL `/apply`.

**Payload** — The data sent in a request. *Anchor:* the `payload jsonb` parameter to `create_order`.

**Postgres** — The database engine Supabase runs. Open-source, very mature, very strict about correctness.

**Preview deployment** — A unique URL Vercel builds for every PR so you can click around the change before merging.

**Primary key** — The column that uniquely identifies a row, usually `uuid`. *Anchor:* `products.id uuid`.

**Production** — The live version of the app users see. *Anchor:* deploys to Vercel from `main` branch.

**PromptPay** — Thailand's bank-to-bank instant payment system, mostly used via QR code at point of sale. The customer scans the cashier's QR with any Thai banking app and the money lands in the seller's account in seconds. MochiPOS generates the QR client-side from the EMVCo spec + CRC16. *Anchor:* `src/lib/promptpay/`; UI in `src/app/app/pos/PromptPayDisplay.tsx`.

**Pull request (PR)** — A request to merge a branch into `main`, with a description and review.

---

## Q

**Query** — A request to the database. Can be SELECT (read), INSERT (create), UPDATE (modify), DELETE (remove).

---

## R

**React** — The UI library Next.js uses. You write components; React renders HTML. *Version:* 19.

**Rebase** — Replaying your branch's commits on top of the latest `main`. Used when `main` has moved on while your branch was open. *Command:* `git rebase origin/main`.

**Refund (vs void vs correction)** — Three different ways MochiPOS "undoes" a sale, all distinct: **void** = cancel the entire order (full or partial, Wave 26); **correction** = edit an existing order — different items, different total (`correct_order` RPC); **refund** = give money back without otherwise changing the order record. Each is a separate RPC and writes its own audit log row.

**Resend** — The email-sending service MochiPOS uses for application notifications and invites. *Anchor:* `src/lib/email/resend.ts`.

**RLS (Row Level Security)** — A rule on a table that says "this user can only see/change rows where X." Enforced inside the database. *Anchor:* `database/rls-policies.sql`. *Booth:* the file cabinet has built-in locks.

**RPC (Remote Procedure Call)** — A function call that goes over the network. In MochiPOS context, "RPC" usually means a Postgres function called from the app. *Anchor:* `create_order`, `claim_registration_token`, etc.

---

## S

**Sample bucket** — Stock units physically on display at the booth. Reduce sellable booth stock but never auto-return to warehouse. *Anchor:* `event_inventory.sample_qty` + `convert_event_to_sample` / `convert_sample_to_event` RPCs.

**Satang** — Smallest unit of Thai baht. 1 THB = 100 satang. MochiPOS stores all money as integer satang.

**Schema** — The shape of the database: which tables, which columns, what types, what constraints. *Anchor:* `database/schema.sql`.

**`security definer`** — A Postgres function attribute meaning "run with the function owner's permissions, not the caller's." Lets cashiers do controlled actions they normally couldn't. *Anchor:* every RPC in `database/functions/`.

**Send Later** — A MochiPOS order type where the customer pays at the booth but the items ship after the event. *Anchor:* `send_later_orders` table.

**Server component** — A React component that runs on the server. Default in Next.js App Router. Cannot use browser-only features like `useState`. *Anchor:* `src/app/page.tsx`.

**Service role key** — The all-powerful Supabase key that bypasses RLS. Backend only. If leaked, attackers can read every tenant's data. *Env var:* `SUPABASE_SERVICE_ROLE_KEY`.

**Session** — A logged-in state. Carried by JWT cookies. *Anchor:* `src/lib/supabase/server.ts`.

**Slug** — A URL-friendly version of a name (`"Cat Toys Co" → "cat-toys-co"`). *Anchor:* `src/lib/slug/index.ts`; `workspaces.slug`.

**Split payment** — One order paid by more than one method on the same bill (e.g., 500 THB cash + 300 THB PromptPay + 200 THB card). MochiPOS supports up to three tenders per order, each recorded as its own `payment_records` row. *Anchor:* `src/lib/pos/splits.ts`; UI in `SplitPaymentBlock.tsx` (Wave 22).

**SQL** — The language used to talk to relational databases. SELECT, INSERT, UPDATE, DELETE.

**SSR (server-side rendering)** — Generating the page HTML on the server before sending it to the browser. The default for Next.js App Router server components.

**Stock count session** — A walk-the-warehouse inventory recount that locks current quantities, accepts per-SKU physical counts with a per-line variance reason, and commits as a single adjustment with audit. Designed to fix the drift that builds up over multi-day events. *Anchor:* `/app/stock-count` route; `StockCountManager.tsx` (Wave 33).

**Supabase** — The backend-as-a-service MochiPOS uses for database, auth, file storage. Built on Postgres. *Anchor:* `src/lib/supabase/`.

---

## T

**Tailwind** — A CSS framework used by class names like `text-sm font-bold rounded-xl`. No separate `.css` file per component. *Anchor:* `src/app/globals.css` + class names everywhere.

**Tenant** — One customer of the SaaS. In MochiPOS = one workspace = one pet brand. *Anchor:* `workspaces` table.

**Token (registration)** — A 16-char one-shot string. The credential for the customer-portal flow. *Anchor:* `customer_registration_tokens` table.

**Transaction (DB)** — A sequence of SQL operations that all succeed or all roll back. Inside a Postgres function, everything is one transaction by default.

**TypeScript (TS)** — A typed superset of JavaScript. Catches bugs at edit time. *Version:* 5.

---

## U

**`"use client"`** — A directive on line 1 of a file marking it as a client component (browser code).

**`"use server"`** — A directive marking a file as Server Actions only.

**`useState`** — A React hook for storing local component state in the browser. Only works in client components. *Anchor:* `src/app/apply/Form.tsx` line 16.

**`useTransition`** — A React hook for marking state updates as low-priority and tracking pending state. *Anchor:* `src/app/apply/Form.tsx` line 15.

**UUID** — Universally unique identifier. A 128-bit random ID, e.g. `550e8400-e29b-41d4-a716-446655440000`. MochiPOS uses uuid for every primary key.

---

## V

**Vercel** — The hosting service that runs the Next.js app. GitHub-connected: every PR gets a preview, every merge to main updates production.

**Vitest** — The test runner used for unit tests. *Command:* `npm test`. *Anchor:* `tests/lib/*.test.ts`.

---

## W

**Wave (project term)** — A medium-sized batch of work in MochiPOS, e.g. "Wave 39a sample bucket data layer". Different from `DD-XX` micro-batches. *Anchor:* `TASKS.md`, commit prefixes like `[Wave 40b]`.

**Webhook** — An incoming HTTP call from an external service (Stripe, Resend, etc.) telling MochiPOS something happened. Not used yet.

**Workspace** — Same thing as a tenant in MochiPOS. One row in `workspaces`. *Anchor:* every business table has `workspace_id`.

---

## X-Z

**Zod** — A validation library for runtime type checking. Used to validate form input on both client and server. *Anchor:* `src/app/apply/schema.ts`.
