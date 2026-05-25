<!-- Keep PRs small + focused. CI (typecheck · lint · test · build) must be green before merge. -->

## What & why


## Checklist
- [ ] CI green (typecheck · lint · test · build).
- [ ] Tested against **my own dev workspace**, not real pilot data (shared Supabase — see `docs/TEAM_WORKFLOW.md`).
- [ ] **Risky area?** (auth · RLS · money/satang · inventory · refunds · migrations) → flagged below + pinged the other dev for a look before merge.
- [ ] **Schema/RLS change?** → migration file added under `database/migrations/`, ledger entry in `docs/DEPLOYMENT.md`, and applied to the shared Supabase (note who/when below).
- [ ] **New env var?** → added to `.env.example` + `docs/ENV_VARS.md` (and ping @founder to add it in Vercel).

## Risk / migration / env notes

