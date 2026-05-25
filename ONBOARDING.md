# MochiPOS — co-founder onboarding

**Welcome, co-founder** 👋 — MochiPOS is a multi-tenant POS SaaS for cat-product
booth sellers (Next.js 16 · React 19 · TypeScript · Tailwind 4 · Supabase ·
Vercel), built by you and visanchan as equal partners. This gets you from zero to
shipping. Open it in Claude Code and it can walk you through each step.

> First, skim these (5 min): [`CLAUDE.md`](CLAUDE.md) (how we build + hard rules),
> [`docs/ROADMAP.md`](docs/ROADMAP.md) (where this is going), and
> [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md) (**how the two of us work
> together — read this one carefully**).

## 1. Prerequisites
- **Node 20+** (CI runs Node 20; 22/24 LTS are fine) and **git**.
- **GitHub** access to `visanchan/mochipos` (you've been added as a collaborator).
- **Supabase** team access to the project (you've been added) — you'll copy keys
  from its dashboard yourself.
- You do **not** need Vercel access. You get a preview URL on every PR via GitHub,
  and visanchan owns Vercel/production.

## 2. Get it running locally
```bash
git clone https://github.com/visanchan/mochipos.git
cd mochipos
npm ci
cp .env.example .env.local
```
Now fill in `.env.local` from the **Supabase dashboard → Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` ← Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← anon public key
- `SUPABASE_SERVICE_ROLE_KEY` ← service_role key — **secret, server-only, bypasses RLS. Never commit it.**

(Resend keys are optional for dev — ask visanchan if you need email to actually send; otherwise email steps just no-op.)

```bash
npm run dev      # http://localhost:3000
npm test         # should be all green
```

## 3. Make your OWN dev workspace (important)
We share **one** Supabase database, so **never test against real pilot data**.
The app isolates everything by `workspace_id` (RLS), so give yourself a private
workspace:
1. **Sign up** via the app (`/register` needs an invite code, so for dev just
   create your user in Supabase → Auth → Users, or sign up however visanchan
   set up), so an auth user exists for your email.
2. Seed **your own** workspace (products + an event + stock):
   ```bash
   node --env-file=.env.local scripts/seed-dev-workspace.mjs you@email.com "Your Dev"
   ```
   It's idempotent (re-running just reports your existing workspace) and isolated
   from everyone else via RLS.
3. Log in → you land in your workspace → Products / Events / POS are yours.

> Don't run `database/seed.sql` as the second dev — it targets the *first* auth
> user (visanchan). Use the script above instead.

See `docs/TEAM_WORKFLOW.md` §3 for the full shared-DB rules.

## 4. How we ship (the short version)
- Branch off `main`: `pos/<slug>`. **One person per branch.**
- Push → open a **PR** → **CI must be green** (`typecheck · lint · test · build`).
- **Self-merge is OK** (squash + delete branch) — but **ping visanchan for a
  quick look on risky changes**: auth, RLS, money/satang, inventory, refunds, or
  any database migration.
- Keep PRs **small**. Pull `main` before you start so you don't drift.
- The PR template will remind you about migrations / env vars / testing in your
  own workspace.

## 5. Things to coordinate (not solo)
- **Schema changes** (tables, RLS, functions): edit `schema.sql` + add a file under
  `database/migrations/` + a ledger note in `docs/DEPLOYMENT.md`, then **one of us
  applies it** in the Supabase SQL editor (shared DB → it lands for everyone). Don't
  hand-edit the live schema without a migration file.
- **Env vars / Vercel**: new env var → add to `.env.example` + `docs/ENV_VARS.md`,
  then ping **visanchan** to add it in Vercel (he holds that access for now).

## 6. Your first PR (suggested)
Pick something tiny to exercise the loop end-to-end — a copy tweak, a small test,
or a `ready-for-claude` item from [`TASKS.md`](TASKS.md). Branch → change →
`npm run typecheck && npm run lint && npm test` → PR → green → merge. Welcome aboard, co-founder.

## Key docs
- [`CLAUDE.md`](CLAUDE.md) — build protocol + hard rules (money in satang, RLS, etc.).
- [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md) — the two-of-us workflow.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — commands, code style, conventions.
- [`docs/STATUS.md`](docs/STATUS.md) — what's built / wired right now.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — product direction.
