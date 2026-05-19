# Deployment (Vercel)

## One-time setup

1. **Push the repo to GitHub** if not already there.
2. https://vercel.com → New Project → Import the repo.
3. **Root Directory**: `pos-for-sell` (this is critical — Vercel will run `npm install` and `npm run build` inside this folder).
4. **Framework Preset**: Next.js (auto-detected).
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `.next` (default).
7. **Install Command**: `npm install` (default).
8. **Environment Variables**: copy from `pos-for-sell/.env.local` (see `docs/ENV_VARS.md`).
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

Set per-environment env vars in Vercel — production should point at the production Supabase project, preview at a staging project (or share production read-only).

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
