# Cat Booth POS — pos-for-sell

Multi-tenant POS SaaS for cat-product booth sellers. Built on Next.js 16 + Supabase + Vercel + Resend.

MochiPOS is a **standalone repo** (`visanchan/mochipos`), extracted May 2026 from the `meowmeow_sandbox` monorepo where it started as the `pos-for-sell/` folder. Several SaaS patterns (sample bucket, Send Later, free-gift) are ported from the field-proven **MeowMeow Event POS** booth app, which lives in its own repo (`visanchan/meowmeow_sandbox`). MochiPOS has its own protocol, batch namespace, and architecture — see [`CLAUDE.md`](./CLAUDE.md).

## Quick links

**Start here (founder / first-time reader):**

- [`docs/LEARNING.md`](./docs/LEARNING.md) — 5-level curriculum for reading this repo without being a full-time engineer. Open `http://localhost:3000/learn` for the visual version while the dev server is running.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — where MochiPOS is going (beachhead, modules, pricing, 6-month plan).
- [`docs/STATUS.md`](./docs/STATUS.md) — current state of routes, libraries, waves landed.

**Building / executing:**

- [`CLAUDE.md`](./CLAUDE.md) — execution protocol and hard rules.
- [`TASKS.md`](./TASKS.md) — live status board.
- [`docs/PROJECT_VISION.md`](./docs/PROJECT_VISION.md) — what we're building, for whom.
- [`docs/BATCH_PLAN.md`](./docs/BATCH_PLAN.md) — all 100 planned batches.
- [`docs/USER_FLOW.md`](./docs/USER_FLOW.md) — application → invite → workspace → POS flow.
- [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) — table list, RLS approach.
- [`docs/DESIGN_TOKENS.md`](./docs/DESIGN_TOKENS.md) — palette + typography from meowmeow.
- [`docs/PILOT_RULES.md`](./docs/PILOT_RULES.md) — accept/reject criteria for pilot applicants.

## Setup

### 1. Install

```bash
cd pos-for-sell
npm install
```

### 2. Create accounts

You'll need three accounts for full functionality:

1. **Supabase** — https://app.supabase.com → create a new project. From `Settings → API`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose)
2. **Resend** — https://resend.com → create an API key → `RESEND_API_KEY`. Set `EMAIL_FROM` and `ADMIN_EMAIL`.
3. **Vercel** — https://vercel.com → link this repo when ready to deploy.

### 3. `.env.local`

```bash
cp .env.example .env.local
# then fill in the keys
```

### 4. Apply database

In the Supabase SQL editor, paste-and-run each file in this order:

1. `database/schema.sql` — tables + helper functions.
2. `database/functions/*.sql` — the 10 security-definer RPCs (`create_order`, `void_order`, `correct_order`, `redeem_invite_code`, `approve_application`, `reject_application`, `create_registration_token`, `claim_registration_token`, `convert_event_to_sample`, `convert_sample_to_event`). RLS routes order/audit writes **through** these, so don't skip them.
3. `database/rls-policies.sql`
4. `database/seed.sql` (optional — only after you've created at least one Auth user via the app).

Do **not** run `database/migrations/` on a fresh DB — `schema.sql` is the source of truth and already includes them; migrations only move an *existing* DB forward.

### 5. Run

```bash
npm run dev
# http://localhost:3000
```

### 6. Become an admin

After signing up via the app:

```sql
insert into public.admin_users (user_id) values ('<your-user-uuid>');
```

The admin pages at `/admin/*` will then become accessible.

## Try it locally

Once `npm run dev` is running, here's where to actually find the app. The landing page is just the marketing/apply form — most of the product lives behind `/app/*` and `/admin/*`.

| URL | What it is | Needs |
|---|---|---|
| `/` | Marketing landing + Apply CTA. Public. | nothing |
| `/apply` | Pilot application form (DD-14). Public. | nothing |
| `/apply/success` | Post-submit confirmation. | nothing |
| `/learn` | Founder learning curriculum landing (recently added). Public. | nothing |
| `/app` | Tenant home — 4 tiles for POS / Products / Dashboard / Send-later. | demo mode OK |
| `/app/pos` | **The actual POS demo** — product grid, sticky cart, mock checkout. | demo mode OK |
| `/app/dashboard` | Today + multi-period dashboard tiles with mock data. | demo mode OK |
| `/app/events` | Event setup — per-day stock allocation, booth-rule toggles, free-gift rule. | demo mode OK |
| `/app/setup/products` | Product setup (add/edit modal with image compress). | demo mode OK |
| `/app/inventory/samples` | Sample bucket convert UI (Wave 39b). | demo mode OK |
| `/app/stock-count` | Physical-count reconciliation flow. | demo mode OK |
| `/register/[token]` | Customer Portal claim page (Wave 40b). | demo mode OK |
| `/admin` | Platform-admin home. | Supabase + admin_users row |
| `/admin/applications` | Applications queue (approve/reject). | Supabase + admin |

**Demo mode** — if `NEXT_PUBLIC_SUPABASE_URL` is not set, the `/app/*` and `/admin/*` pages render against mock data instead of failing. A yellow "Demo mode" banner shows in the app shell. This is the fastest way to explore the UI without setting up Supabase first.

**Admin mode** — `/admin/*` redirects elsewhere unless your auth user has a row in `public.admin_users`. See step 6 above.

## Project structure

```
pos-for-sell/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── apply/          # public application form
│   │   ├── register/       # /register = invite-code redemption stub; /register/[token] = customer portal claim (Wave 40)
│   │   ├── learn/          # founder learning curriculum landing
│   │   ├── login/
│   │   ├── admin/          # platform admin pages
│   │   └── app/            # tenant app (POS, dashboard, setup, inventory, …)
│   ├── components/
│   ├── lib/
│   │   ├── supabase/       # browser/server/admin Supabase clients
│   │   ├── email/          # Resend wrapper + templates
│   │   ├── i18n/           # EN/TH dictionaries + getDict (Wave 19)
│   │   ├── pos/            # cart store, calc, splits
│   │   └── database.types.ts
│   └── proxy.ts            # session refresh (Next 16 rename of middleware.ts)
├── database/
│   ├── schema.sql
│   ├── rls-policies.sql
│   ├── seed.sql
│   └── functions/          # SECURITY DEFINER RPCs (create_order, etc.)
├── tests/
│   ├── lib/                # vitest unit tests (~34 files)
│   └── e2e/                # playwright smoke tests
├── docs/
└── public/
```

## Status

Foundation (Phase 0, batches DD-01 through DD-12) — see `TASKS.md`. Phase 1 (public application flow) is partially scaffolded; persistence batches (DD-15+) are blocked on Supabase credentials.

After the original 100-batch plan, work shifted to **organic "Wave NN" feature batches** driven by competitor research, the meowmeow Pet Expo field findings, and the strategic correction in [`docs/ROADMAP.md`](docs/ROADMAP.md). For the current snapshot — routes, libraries, test count, latest waves landed — see [`docs/STATUS.md`](docs/STATUS.md), which is the live source of truth and stays current as waves merge. Wave naming convention in [`docs/BATCH_PLAN.md`](docs/BATCH_PLAN.md) "Post-DD-100 Waves" section.

## Architecture in one paragraph

Two connected layers per [`docs/PROJECT_VISION.md`](docs/PROJECT_VISION.md): the **POS App** (`/app/*`, seller-facing, fast checkout, optional customer fields, no pet UI) and the **Customer Portal** (`/register/[token]`, customer-facing, anon, post-purchase, captures profile + multi-channel contacts + optional pet info). The two layers are connected by a 16-char single-use token issued at checkout and redeemed by the customer via QR or share link. Pet profile is the booth-seller competitive moat but lives in the portal layer, never in the cashier flow.
