# Team workflow — MochiPOS

How the two **co-founders** (+ Claude) work on this repo together without stepping
on each other or the live pilot data. Set up 2026-05-25 when the project went from
solo to a two-co-founder team.

**Chosen setup:** two co-founders · **one shared Supabase project** · PRs + CI,
**self-merge allowed** (no mandatory review). This doc makes that safe.

**Live board → [`../BOARD.md`](../BOARD.md)** — who's on what right now (tasks live
as GitHub issues; the board is the at-a-glance view). `TASKS.md` is the Done/batch
history; `docs/BATCH_PLAN.md` is the long-term plan; `docs/STATUS.md` is the snapshot.

---

## The team & how we split focus (read first)

Two **co-founders** — equal partners — plus Claude (AI). We lean into different
**focuses** (not ranks) and pick **lanes** (the `area:` label) so we rarely edit the
same files; the big calls are shared.

| Who | Focus (complementary — *not* a hierarchy) | Default lane (`area:`) |
|---|---|---|
| **visanchan** (co-founder) | Product, direction, scope, UX & flow, brand, real-event field testing — the *what & why*. | `area: ui` (+ product calls) |
| **Problemiesd** (co-founder) | Engineering — reads, writes + fixes code — plus real-human testing — the *how, and does it hold up*. | `area: backend` / `area: qa` |
| **Claude** (AI) | Implements, fixes, explores improvements, and **integrates** everyone's branches (keeps `main` green — see *Integration & conflict handling*). Serves both co-founders. | `area: backend` |

Lanes are **soft defaults** to avoid collisions — either co-founder can work
anywhere; the label just says "who's likely in these files right now."

**Conflict-prevention rules**
- One person per branch/feature. Keep PRs small; merge often.
- **Two of us coding at once → use separate git worktrees** (same repo, different
  folder): `git worktree add ../mochipos-<x> -b pos/<branch> origin/main`. Never run
  two sessions in the same folder (that caused the PR #22/#23 tangle).
- Lanes are defaults, not fences — if you cross into another lane, say so on the issue.

## Milestones (stages — "where are we")

Stages from the ROADMAP §33 six-month plan, tracked as **GitHub Milestones** (every
issue carries one):

| Milestone | Goal | Status |
|---|---|---|
| **M1 — Onboarding & first sale** | invite → workspace → catalog → event + stock → real POS sale | ✅ essentially done (closing out) |
| **M2 — Event operations** | receipt · Send Later · sample stock · daily dashboard · restock/correction · CSV · product images | next |
| **M3 — Customer portal** | QR registration · customer + pet profile · consent · order linking · customer dashboard | later |
| **M4 — Pilot hardening** | bug fixes · onboarding · admin/pilot monitoring · RLS review · backup/export · real-event test · feedback | before pilot |
| *cross-cutting* | `dx` hygiene (lint, cleanups) | ongoing |

> On the [board](https://github.com/users/visanchan/projects/1): **Milestone = where we
> are · `area:` = whose lane · assignee = who · column = status.**

## Conventions cheat-sheet (one pattern for all of us)

- **Branch:** `pos/<id>-slug` — `DD-XX`, `wave-NN`, `fix-…`, or `chore-…`, off latest `main`.
- **Commit:** `[DD-XX] / [Wave NN] / [fix] / [chore] one-line` + a body with the *why*
  and any migration / env / risk note. Co-author Claude when it did the work.
- **A task = a GitHub Issue** → **assignee** (who) · **milestone** (stage) · **`area:`**
  (lane) · optional **`arc:`** (feature group). "Grab" = assign yourself + move it to
  *In Progress* on the board.
- **Labels:** `area: backend|ui|qa` (lane) · `arc: …` (feature) · `good first issue` ·
  `needs-migration`.
- **Board:** [GitHub Project](https://github.com/users/visanchan/projects/1) kanban
  (Todo → In Progress → In Review → Done). `BOARD.md` mirrors it for repo readers.
- **PR + merge:** every change is a PR; **CI (typecheck · lint · test · build) must be
  green**; self-merge is OK, **but ping the other dev for a look on risky areas** (auth ·
  RLS · money/satang · inventory · refunds · migrations). Details in §2–§3 below.
- **Migrations:** SQL file under `database/migrations/` + a ledger note in
  `docs/DEPLOYMENT.md` + **a human applies it** in the Supabase SQL editor (Claude can't
  run DDL).

## Integration & conflict handling

Parallel branches are merged together by **Claude (integrator)**, who keeps `main`
green.

**Prevent first.** Conflicts should be rare and tiny — that's the point of lanes
(different files), small + frequent PRs, and separate worktrees. The integrator is a
safety net, not a reason to batch up big "merge it all at the end" merges.

**Two kinds of conflict:**
- **Textual / compatible** — both sides touched nearby lines, or added different
  things. Claude resolves to **keep both features**, re-runs CI, and pings the author
  to confirm their part survived.
- **Semantic / incompatible** — both sides changed the *same behaviour* in *different
  ways*. That's a **product decision, not a merge** → Claude surfaces the clash + the
  trade-off and **the co-founders decide** (product call led by visanchan; the
  "never auto-resolve conflicts heuristically" rule).

**A merge is only "done" when all three agree:** Claude's resolution **+** the author's
quick look (especially code Claude didn't write) **+** **green CI**.
> Flow: **resolve → author + CI confirm → merge.** No blind merges.

---

## 1. Who can touch what

| | GitHub repo | Supabase **data** (rows, auth users) | Supabase **settings & SQL** (schema, RLS, Auth config, Storage, Redirect URLs) | Vercel |
|---|---|---|---|---|
| **visanchan** (co-founder) | ✅ collaborator | ✅ via dashboard + keys | ✅ dashboard / SQL editor | ✅ holds access *(for now — can add Problemiesd anytime)* |
| **Problemiesd** (co-founder) | ✅ collaborator | ✅ via dashboard + keys (Supabase team) | ✅ dashboard / SQL editor (Supabase team) | ⏳ not yet (gets PR preview URLs via GitHub) |
| **Claude** (AI) | ✅ branches + PRs | ✅ read/write via the service-role key in `.env.local` (used carefully; diagnostics read-only) | ❌ can't run DDL or change settings — **writes the `.sql`, a human applies it** | ❌ none (only sees PR check status relayed by GitHub) |

**Implication:** anything that is *Vercel config* (env vars, domains) goes through **visanchan** (he holds Vercel access for now — and can add Problemiesd anytime). Anything that is *Supabase schema/settings* (running a migration, RLS, Auth Redirect URLs, Storage buckets) is a **human** task (either dev) — Claude prepares it, a human applies it.

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

> **GitHub setting to add (visanchan, 2 min):** Settings → Branches → add a rule for `main`: **Require status checks to pass before merging** → select the CI check. Leave "require approvals" **off** (you chose self-merge). This enforces "green CI before merge" without blocking either of you from merging your own PR.

---

## 3. The shared-database rules (most important)

You both point at **one** Supabase project — local dev, Vercel preview, and Vercel production all hit the **same database**. That's simplest, but it means a careless change can hit real pilot data. These rules keep it safe:

### 3a. Isolate yourselves with workspaces, not databases
The app is **multi-tenant with RLS** — every row is scoped to a `workspace_id`, and RLS blocks cross-workspace reads. Use that as your isolation boundary:

- Each co-founder works in their **own dev workspace** (e.g. "visanchan Dev", "Problemiesd Dev") — seed it with `scripts/seed-dev-workspace.mjs`.
- **Real pilot sellers get their own workspaces.** Never test against a real pilot workspace's data.
- Because of RLS, one co-founder's dev workspace can't see the other's, and neither can see the pilot's — so day-to-day building (products, events, sales) is already isolated **inside the one project**. This recovers most of what a separate staging project would give.

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
- Resend keys (`RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`) aren't in Supabase — visanchan shares those, or you develop without them (email steps degrade to best-effort).

---

## 4. Environments

| Environment | Where | Database | Who |
|---|---|---|---|
| **Local dev** | each dev's machine (`npm run dev`) | shared Supabase (via `.env.local`) | both devs + Claude |
| **PR preview** | Vercel auto-builds a URL per PR | shared Supabase (Vercel project env) | visible to both on the PR (friend sees the URL via GitHub even without Vercel) |
| **Production** | `mochipos.vercel.app` (Vercel, branch `main`) | shared Supabase | visanchan holds Vercel access; deploys on every merge to `main` |

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
