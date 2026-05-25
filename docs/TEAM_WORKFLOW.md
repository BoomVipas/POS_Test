# Team workflow — MochiPOS

How two developers (+ Claude) work on this repo together without stepping on each
other or the live pilot data. Set up 2026-05-25 when the project went from solo to
a two-person team.

**Chosen setup:** two co-developers · **one shared Supabase project** · PRs + CI,
**self-merge allowed** (no mandatory review). This doc makes that safe.

**Live board → [`../BOARD.md`](../BOARD.md)** — who's on what right now (tasks live
as GitHub issues; the board is the at-a-glance view). `TASKS.md` is the Done/batch
history; `docs/BATCH_PLAN.md` is the long-term plan; `docs/STATUS.md` is the snapshot.

---

## 1. Who can touch what

| | GitHub repo | Supabase **data** (rows, auth users) | Supabase **settings & SQL** (schema, RLS, Auth config, Storage, Redirect URLs) | Vercel |
|---|---|---|---|---|
| **Founder** (you) | ✅ collaborator | ✅ via dashboard + keys | ✅ dashboard / SQL editor | ✅ **owner — only you** |
| **Friend** (co-dev) | ✅ collaborator | ✅ via dashboard + keys (Supabase team) | ✅ dashboard / SQL editor (Supabase team) | ❌ no access (gets PR preview URLs via GitHub) |
| **Claude** (AI) | ✅ branches + PRs | ✅ read/write via the service-role key in `.env.local` (used carefully; diagnostics read-only) | ❌ can't run DDL or change settings — **writes the `.sql`, a human applies it** | ❌ none (only sees PR check status relayed by GitHub) |

**Implication:** anything that is *Vercel config* (env vars, domains) is the **founder's** task. Anything that is *Supabase schema/settings* (running a migration, RLS, Auth Redirect URLs, Storage buckets) is a **human** task (either dev) — Claude prepares it, a human applies it.

---

## 2. Branching & merge (PRs + CI, self-merge)

- `main` is **always deployable** — Vercel auto-deploys it to **production**. Never push straight to `main`; always branch → PR.
- One branch per task, off the latest `main`: `pos/DD-XX-slug`, `pos/wave-NN-slug`, or `pos/fix-slug` / `pos/chore-slug`. **One person per branch** — don't both commit to the same branch.
- **CI must be green** before merge: `typecheck · lint · test · build` (`.github/workflows/ci.yml`). With no required review, CI is the safety net — don't merge red.
- **Self-merge is fine** (squash-merge, delete the branch). But:
  - **Ping the other dev for a 2-minute look on risky changes** — auth, RLS, money/satang, inventory, refunds, or any **migration**. Soft rule, not enforced by GitHub; honour it.
  - Keep PRs **small and single-purpose** so self-merge stays low-risk and history reads cleanly.
- **Pull `main` before you start**, and merge `main` into a long-running branch often, to avoid conflicts. Two people + Vercel-on-every-merge means `main` moves — stay synced.
- **Never auto-resolve a merge conflict by guessing.** Surface it and resolve deliberately.

> **GitHub setting to add (founder, 2 min):** Settings → Branches → add a rule for `main`: **Require status checks to pass before merging** → select the CI check. Leave "require approvals" **off** (you chose self-merge). This enforces "green CI before merge" without blocking either of you from merging your own PR.

---

## 3. The shared-database rules (most important)

You both point at **one** Supabase project — local dev, Vercel preview, and Vercel production all hit the **same database**. That's simplest, but it means a careless change can hit real pilot data. These rules keep it safe:

### 3a. Isolate yourselves with workspaces, not databases
The app is **multi-tenant with RLS** — every row is scoped to a `workspace_id`, and RLS blocks cross-workspace reads. Use that as your isolation boundary:

- Each of you works in your **own dev workspace** (e.g. "Boom Dev", "Friend Dev"). Create one via `seed.sql` or the register flow.
- **Real pilot sellers get their own workspaces.** Never test against a real pilot workspace's data.
- Because of RLS, your dev workspace can't see your friend's, and neither can see the pilot's — so day-to-day building (products, events, sales) is already isolated **inside the one project**. This recovers most of what a separate staging project would give.

### 3b. Schema changes go through migrations (never ad-hoc)
`schema.sql` / `rls-policies.sql` / `database/functions/*` are the **source of truth in git**, but the live DB only changes when a human applies SQL. So:

1. Make the schema change in the repo: edit `schema.sql` (source of truth) **and** add a forward-only file under `database/migrations/` (`YYYY-MM-DD_what.sql`) that moves an *existing* DB forward.
2. Add a **ledger entry in `docs/DEPLOYMENT.md`** (the migration ledger) so everyone can see what's been applied.
3. In the PR, say "needs migration" and **coordinate** — agree who applies it.
4. **One person applies it** in the Supabase SQL editor (it's the shared DB, so it lands for everyone at once), then notes "applied YYYY-MM-DD" in the ledger.
5. The other dev (and Vercel) pick it up automatically — same DB. Pull `main` to get the updated types/code.

> Migrations are **forward-only** and should be **idempotent** (`create … if not exists`, `on conflict …`, find-or-create) so re-running is safe. (`seed.sql` is idempotent for exactly this reason.)

### 3c. Keys & secrets
- `.env.local` is **git-ignored** — never commit it. Copy from `.env.example`.
- **Get your own keys from the dashboard:** Supabase → Settings → API → copy `URL`, `anon`, `service_role` into your `.env.local`. (Your friend has Supabase team access, so they self-serve — no one emails keys around.)
- The **`service_role` key bypasses RLS** — server-only, never `NEXT_PUBLIC_`, never imported by client code. Treat it like a password.
- Resend keys (`RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`) aren't in Supabase — the founder shares those, or you develop without them (email steps degrade to best-effort).

---

## 4. Environments

| Environment | Where | Database | Who |
|---|---|---|---|
| **Local dev** | each dev's machine (`npm run dev`) | shared Supabase (via `.env.local`) | both devs + Claude |
| **PR preview** | Vercel auto-builds a URL per PR | shared Supabase (Vercel project env) | visible to both on the PR (friend sees the URL via GitHub even without Vercel) |
| **Production** | `mochipos.vercel.app` (Vercel, branch `main`) | shared Supabase | founder owns Vercel; deploys on every merge to `main` |

There is **no separate staging DB** (by choice). Workspaces (§3a) are the isolation boundary instead. If pilot data ever feels at risk, the upgrade path is a second free-tier Supabase project for staging — but not now.

---

## 5. Where Claude fits

- Claude works the same way: branch → PR → CI green → squash-merge. Either of you can direct it.
- Claude **flags risky changes** (auth/RLS/money/inventory/migrations) for a human's eyes even though review isn't required.
- Claude **cannot** run migrations, change Supabase settings, or touch Vercel — it routes those to a human with exact steps.
- **With two humans now active, don't leave an unattended auto-merging loop running** while someone else is mid-task — it can collide with a human's branch or merge during their work. If you want a loop, keep it scoped and coordinate, or have Claude open PRs and leave merging to a human.

---

## 6. New-developer onboarding

See **[`ONBOARDING.md`](../ONBOARDING.md)** at the repo root — a step-by-step for getting from zero to shipping (clone → keys → run → make a dev workspace → first PR). It's written to be opened in Claude Code.

---

## 7. Quick reference

```
start work     git checkout main && git pull && git checkout -b pos/<slug>
verify         npm run typecheck && npm run lint && npm test && npm run build
ship           push → open PR → CI green → (ping if risky) → squash-merge → delete branch
schema change  edit schema.sql + add database/migrations/<date>_x.sql + ledger in docs/DEPLOYMENT.md
               + a human applies it in the Supabase SQL editor + marks it applied
test safely    do it in YOUR dev workspace — never against real pilot data
```
