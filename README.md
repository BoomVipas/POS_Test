# Cat Booth POS — pos-for-sell

Multi-tenant POS SaaS for cat-product booth sellers. Built on Next.js 16 + Supabase + Vercel + Resend.

This project lives inside the `meowmeow_sandbox` repo as a sibling to `meowmeow_pos_event.html`. It has its own protocol, batch namespace, and architecture — see `CLAUDE.md`.

## Quick links

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

In the Supabase SQL editor, run in this order:

1. `database/schema.sql`
2. `database/rls-policies.sql`
3. `database/seed.sql` (optional — only after you've created at least one Auth user)

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

## Project structure

```
pos-for-sell/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── apply/          # public application form
│   │   ├── register/       # invite-code redemption
│   │   ├── login/
│   │   ├── admin/          # platform admin pages
│   │   └── app/            # tenant app (POS, dashboard, setup)
│   ├── components/
│   ├── lib/
│   │   ├── supabase/       # browser/server/admin Supabase clients
│   │   ├── email/          # Resend wrapper + templates
│   │   └── database.types.ts
│   └── middleware.ts       # session refresh
├── database/
│   ├── schema.sql
│   ├── rls-policies.sql
│   └── seed.sql
├── docs/
└── public/
```

## Status

Foundation (Phase 0, batches DD-01 through DD-12) — see `TASKS.md`. Phase 1 (public application flow) is partially scaffolded; persistence batches (DD-15+) are blocked on Supabase credentials.

After the original 100-batch plan, work shifted to **organic "Wave NN" feature batches** driven by competitor research, the meowmeow Pet Expo field findings, and the strategic correction in [`../VISION.md`](../VISION.md). As of 2026-05-07: 259 vitest tests pass; latest waves are 39a (sample bucket data layer, PR #4) and 40a (Customer Portal data layer, PR #5). Full wave list in [`docs/STATUS.md`](docs/STATUS.md). Wave naming convention in [`docs/BATCH_PLAN.md`](docs/BATCH_PLAN.md) "Post-DD-100 Waves" section.

## Architecture in one paragraph

Two connected layers per [`docs/PROJECT_VISION.md`](docs/PROJECT_VISION.md): the **POS App** (`/app/*`, seller-facing, fast checkout, optional customer fields, no pet UI) and the **Customer Portal** (`/register/[token]`, customer-facing, anon, post-purchase, captures profile + multi-channel contacts + optional pet info). The two layers are connected by a 16-char single-use token issued at checkout and redeemed by the customer via QR or share link. Pet profile is the booth-seller competitive moat but lives in the portal layer, never in the cashier flow.
