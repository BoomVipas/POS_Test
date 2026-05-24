# Deployment (Vercel)

## Deploy loop — operational rules (read first)

GitHub + Vercel + Supabase are wired. The day-to-day loop:

**Code change → live:**

```
feature branch (pos/DD-XX-…) → push → PR → Vercel PREVIEW deploy (own URL)
→ review → merge to main → Vercel PRODUCTION deploy (automatic)
```

- **Never push to `main` directly for code.** **High-risk batches (auth, RLS, payments, money totals, inventory atomicity, refunds) require PR + review before merge.**
- **Preview deploys currently run in DEMO mode** — Supabase env vars are set for **Production only**, so PR previews have no DB connection. Safe (previews can't touch prod data), but Supabase-connected behavior is only testable on `main` until we add Preview-scoped env vars or a separate staging Supabase project.

**Database change → live (manual, by design for the pilot):**

```
edit database/*.sql → apply it in the Supabase SQL editor → THEN merge/deploy the app code that depends on it
```

- **Apply the SQL to Supabase _before_ the dependent app code deploys** — otherwise the live app calls a function/column that doesn't exist yet.
- Conventions: a **schema** change also gets a `database/migrations/` file (see `migrations/README.md`); **functions** are `create or replace` (apply directly, order among them irrelevant); **RLS** (`rls-policies.sql`) re-applies the whole file (`drop policy if exists` + `create`) — review carefully, a wrong policy can leak or lock out tenant data.
- Vercel does **not** touch the database. Only app code auto-deploys; SQL is always a separate, deliberate step (until a future Supabase CLI + GitHub Actions setup automates it).

**Secrets — never commit:**

- `.env.local` stays local and git-ignored. The **service-role key** never goes into chat, GitHub, or any client/frontend code (it's server-only and bypasses RLS).
- Vercel keeps its own copy in Project → Settings → Environment Variables. Rotating a key means updating it in both places.

Details for each below.

## One-time setup

1. **Push the repo to GitHub** if not already there.
2. https://vercel.com → New Project → Import the repo.
3. **Root Directory**: `./` (repo root — the Next app *is* the whole repo since the May-2026 extraction to its own repo; do **not** set `pos-for-sell`, that folder no longer exists).
4. **Framework Preset**: Next.js (auto-detected).
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `.next` (default).
7. **Install Command**: `npm install` (default).
8. **Environment Variables**: copy from `.env.local` (see `docs/ENV_VARS.md`). Set them for **Production** (and Preview too if you want DB-connected previews).
9. **Deploy**.

## After first deploy

- The first deployment will fail without the Supabase env vars; that's expected. Add them and redeploy.
- `/admin/*` will gate on `admin_users`. Manually insert a row in Supabase SQL editor:
  ```sql
  insert into public.admin_users (user_id) values ('<your-auth-uid>');
  ```
- Apply database schema and functions in the order shown in the "Database migrations" table below — `schema.sql`, then `rls-policies.sql`, then the 8 functions (and the 2 `migrations/` files if upgrading rather than starting fresh). `seed.sql` is optional, dev only.

## Environments

| Env | Trigger | Use |
|---|---|---|
| Production | merge to `main` | live booth |
| Preview | every PR | review per change |
| Development | `npm run dev` | local |

Set per-environment env vars in Vercel — production points at the production Supabase project. **Currently env vars are Production-only, so Preview deploys run in demo mode** (no DB); add Preview-scoped vars or a staging Supabase project when you need DB-connected previews.

## Domains

- Production gets `<project>.vercel.app` automatically.
- Custom domain (e.g. `catbooth.app`) can be added in Vercel Project Settings → Domains.
- Configure DNS at the registrar per Vercel's instructions.
- TLS is automatic.

## Rollbacks

Vercel keeps every deployment. From the dashboard, click any past deploy → Promote → Promote to Production. Rollback takes seconds and is non-destructive.

## Database migrations

Schema changes ship as new SQL files under `database/`. Apply them in order in the Supabase SQL editor. There is no `migrate` CLI in this repo yet; for the pilot, manual application is fine.

**Fresh install vs upgrade:** `schema.sql` reflects the current shape of all tables (18 as of 2026-05-18). A fresh Supabase project only needs `schema.sql` + `rls-policies.sql` + the functions. The `migrations/` files are for upgrading a database that was bootstrapped from an earlier schema — `add_sample_qty` adds the Wave 39a column; `customer_portal` adds the 5 Wave 40a tables.

| # | Date | File | Notes |
|---|---|---|---|
| 1 | unapplied | `schema.sql` | All 18 tables + helpers (verified 2026-05-18) |
| 2 | unapplied | `rls-policies.sql` | Full RLS policy set + helpers |
| 3 | unapplied | `migrations/2026-05-07_add_sample_qty.sql` | Wave 39a: adds `event_inventory.sample_qty` (skip on fresh install) |
| 4 | unapplied | `migrations/2026-05-07_customer_portal.sql` | Wave 40a: adds 5 customer-portal tables + RLS (skip on fresh install) |
| 5 | unapplied | `functions/redeem_invite_code.sql` | Workspace creation from invite code |
| 6 | unapplied | `functions/create_order.sql` | Atomic sale RPC (FOR UPDATE locks) |
| 7 | unapplied | `functions/void_order.sql` | Inventory restore |
| 8 | unapplied | `functions/correct_order.sql` | Order edit + inventory delta |
| 9 | unapplied | `functions/convert_event_to_sample.sql` | Wave 39a: booth → sample bucket |
| 10 | unapplied | `functions/convert_sample_to_event.sql` | Wave 39a: sample bucket → booth |
| 11 | unapplied | `functions/create_registration_token.sql` | Wave 40a: cashier issues post-sale token |
| 12 | unapplied | `functions/claim_registration_token.sql` | Wave 40a: anon customer claim (token-as-credential) |
| 13 | unapplied | `seed.sql` | Demo data (dev only; do NOT run in prod) |

## Build sizes

`npm run build` outputs route-level bundle sizes. Watch for any single page > 200kB First Load JS — investigate before merging.

## Dev → preview → prod promotion

Pilot-stage flow:

1. Create branch `pos/DD-XXX-...` off `main`.
2. Open PR → Vercel auto-builds a preview URL.
3. User reviews preview → merge.
4. Production deploy fires automatically.
5. If bad, click Promote on the previous deploy.
