# Staging Supabase + DB-connected previews

**Goal:** make every PR's Vercel preview run against a **separate staging
database**, so each of you can test your *own* change *with data*, *before*
merging — instead of only being able to test once it's live on `main`. This
removes the two frictions we hit:

- "the data needs Vercel `main` to test" → now testable on the preview.
- "wait for each other to review/merge" → you each validate your own PR independently.

**The shape — two separate Supabase projects:**

```
Production Supabase  ──real pilot data──  Vercel Production  (branch: main)
Staging   Supabase  ──throwaway test──   Vercel Preview     (every PR)
```

RLS still isolates workspaces *within* each project. A preview can never touch
real pilot data, because it points at a **different database**.

---

## One-time setup (visanchan — ~20 min, dashboards only)

### 1. Create the staging project
app.supabase.com → **New project** → name `mochipos-staging`, region Singapore,
**free tier**. It is entirely separate from production.

### 2. Apply the schema (same files + order as prod)
In the staging project's **SQL editor**, run in this order (mirrors
[`DEPLOYMENT.md`](DEPLOYMENT.md) → Database migrations):

1. `database/schema.sql`
2. `database/functions/*.sql` (all 8)
3. `database/rls-policies.sql`

Do **not** run `database/migrations/*` on a fresh project — `schema.sql` already
includes them.

### 3. Auth + storage (same as prod)
- Authentication → Providers → enable **Email** (password sign-in).
- Storage → create `product-images` (public) and `payment-slips` (private).

### 4. Seed obvious test data
- Authentication → Users → add a user (auto-confirm), e.g. `staging@you.dev`.
- Seed a workspace **named literally `STAGING — test only`** (a throwaway
  `.env.staging.local` with the staging keys, git-ignored):
  ```bash
  node --env-file=.env.staging.local scripts/seed-dev-workspace.mjs staging@you.dev "STAGING — test only"
  ```
  The app header shows the workspace name — so "STAGING — test only" doubles as
  your at-a-glance **"which environment am I on?"** signal.

### 5. Point Vercel **Preview** at staging
Vercel → Project → Settings → **Environment Variables**. Add the **staging**
project's three keys, scoped to **Preview** (and Development if you like):

| Var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | staging Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service_role key |

> ⚠ **Leave Production scoped to the production project.** Same variable
> *names*, different *values + scope*. Never put production keys on Preview, or
> staging keys on Production — that's the one mistake that defeats the whole point.

### 6. Let preview URLs log in
Preview URLs are dynamic per-PR, so the **staging** project must allow them.
Authentication → **URL Configuration** → add a wildcard redirect:

- `https://*-<your-vercel-scope>.vercel.app/**`

(That covers the `/auth/confirm` callback used by login + password reset.)

### 7. Verify
- Open any PR → click its Vercel preview URL.
- You should **not** see the amber "Demo mode" banner, and after login you
  should see the **STAGING — test only** workspace.
- Do a test sale → confirm the row lands in **staging** Supabase, not production.

---

## The loop you get (the payoff)

```
branch → PR → CI green + Claude /review + a DB-connected preview URL
       → you click YOUR preview, test with data, self-merge when happy
       → main → production
```

Nobody waits on the other, nothing is tested on production first, and a broken
change still can't reach the booth (CI gate + pre-push hook).

## Safety notes

- **Preview = staging only.** The single thing protecting real pilot data is
  that previews point at a *different* database. Keep it that way.
- **Local dev** (`npm run dev`) uses your `.env.local` — point that at **staging**
  too for day-to-day building, not production.
- **Telling environments apart:** the header workspace name is the quick check.
  Optional hardening later: a small `VERCEL_ENV`-based "PREVIEW" badge in the app
  chrome (a ~20-line follow-up; ask Claude).
- **Schema drift:** when you change `schema.sql`, apply it to **both** projects —
  **staging first** (to test), then production. Log it in `DEPLOYMENT.md`'s ledger.

## Optional later — Supabase CLI (versioned migrations)

Deferred deliberately. When hand-applying SQL to two projects gets tedious, adopt
the Supabase CLI (`supabase migration new` + `supabase db push`) so one versioned
migration applies to staging then prod repeatably. Not needed to get
DB-connected previews, and it would change the current working manual-SQL flow —
so it's a separate decision, not part of this setup.
