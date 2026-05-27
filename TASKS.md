# TASKS — pos-for-sell SaaS

> **Live team board → [`BOARD.md`](BOARD.md)** (who's on what now) + GitHub issues.
> As of the 2-dev setup (2026-05-25), this file is the **batch/Done history + the
> link to the plan** — not the live claim board. New work: grab an issue, move it
> on `BOARD.md`. See [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md).

Batch history + index into the 100-batch plan in [docs/BATCH_PLAN.md](docs/BATCH_PLAN.md).

## Protocol (read before editing)

- **Claim before editing.** Update this file: set `Owner: claude`, `Status: in-progress`, `Branch: pos/DD-XX-...`, `Claimed: <YYYY-MM-DD HH:MM>`. Commit before any code edit.
- **One implementation batch at a time.**
- **Branch per batch.** From latest `main`. PR into `main`. Never push to `main`.
- **Status values:** `planning`, `ready-for-claude`, `in-progress`, `ready-for-review`, `done`, `blocked`, `stale`.
- **Blockers:** if a batch needs an external dep (Supabase keys, Resend keys, Vercel link), set `Status: blocked` with a clear `BlockedBy:` reason.
- After merge, set `Status: done` and move to the **Done** section with the merge SHA.

## Files allowed to edit

Anything inside `pos-for-sell/`. Do not edit files in the root or in `meowmeow_pos_event.html` from a `DD-XX` batch.

## Currently active

_None claimed. ✅ **The post-Supabase wire-up arc (DD-39 login → DD-65 `create_order`) is COMPLETE** (2026-05-25) — see the arc summary in [docs/STATUS.md](docs/STATUS.md). A pilot seller can go invite → workspace → catalog → event + stock → **real atomic sale** on live Supabase, RLS-isolated per tenant. The autonomous loop that drove it (cron `c627795e`) has self-cancelled at its stop condition. Most recent code: **DD-55–66 real POS sale** (`ba53cbc`, PR #9 — see **Done**)._

**Suggested next arc (post-sale polish — unclaimed):** DD-67 real receipt page · DD-45/46 product images → Supabase Storage · DD-49 CSV import · DD-54 setup-complete gate · DD-74 live free-sample toggle · DD-85+ real dashboard on `orders`/`event_inventory` · cleanup of the `redeem_invite_code` dead `set status='expired'` write (noted in DD-33–38).

## Repo migration — pos-for-sell → standalone `mochipos` ✅ COMPLETE (2026-05-25)

Extracted from the `meowmeow_sandbox` monorepo into this standalone repo (`visanchan/mochipos`) via history-preserving `git subtree split` (158 commits, DD-01 → Wave 42). **Migration complete:**

- ✅ New repo created + pushed; verified green (`npm ci` + typecheck + 407 tests + `next build`).
- ✅ Docs de-monorepo'd (cross-repo refs repointed, founder profile vendored into `CLAUDE.md`, provenance note in `docs/STATUS.md`).
- ✅ GitHub Actions CI added (push/PR to main; `npm ci` → typecheck → test → build; green).
- ✅ **Supabase** wired + verified (18 tables / 10 RPCs / RLS active / Email auth on).
- ✅ **Vercel** deployed at `mochipos.vercel.app` — confirmed in **configured** mode against Supabase (the `/app` guard redirects unauthenticated users to `/login`).
- ✅ Original `pos-for-sell/` folder **removed** from `meowmeow_sandbox` (commit `59e80af`) with migration notes in that repo's `CLAUDE.md` / `AGENTS.md`. History recoverable from git if ever needed.
- ⏸ **Remaining cleanup (low priority):** delete the `Mochi POS Design System-handoff/` folder here (a committed design export with a nested duplicate project copy; doesn't affect build/test/deploy).

**Next dev arc:** **DD-39** — wire the `/login` form to Supabase Auth (currently a stub) → **DD-65** — point the cashier flow at the real `create_order` RPC (where the Wave 41 server-side guards activate). To create the first admin user before DD-39 lands: add a user in the Supabase dashboard (Auth → Users, auto-confirm), then run `database/seed.sql`.

> **DD-board status (2026-05-21):** every remaining DD-XX batch is either `done` (often superseded by a later Wave) or `blocked` on **B-1 (Supabase project)** / B-2 (Resend). DD-20 is now `done`. There is **no unblocked DD implementation work left** — provisioning Supabase (B-1, recipe in the Blockers section) is what unblocks the next batches._

## Wave 41 — Pre-Supabase hardening sweep (planning · 2026-05-24)

Twelve-batch arc landing **before** the DD-65 Supabase wire-up. Anchored to a `/debug-mantra` audit sweep done 2026-05-24 against the full pos-for-sell tree (read-only, no edits). Two threads run in parallel:

- **Live thread (41a–41f)**: visible UX/auth/spam issues hittable in today's demo-mode app. Ships now; doesn't need Supabase.
- **Latent thread (41g–41k)**: guards on the Supabase RPCs (`create_order`, `claim_registration_token`, `create_registration_token`) that activate the moment DD-65 wires the cashier flow to real RPCs. Code-only changes to SQL files; can be reviewed without a live database.
- **Wrap (41l)**: ADR + memory + post-mortem links so the next agent can pick up cold.

**Mantra discipline.** Each sub-batch must land a failing test (Vitest for TS, fixture or SQL assertion for DB) before the fix. No fix without a repro — that's the contract for this whole wave.

**Investigation breadcrumbs** — the audit ledger lives in the conversation transcript at `<session 2026-05-24>`. Findings tagged **L1–L6** (live) and **D1–D6** (latent) map 1:1 to sub-batches below. If anything below is unclear, re-read the ledger first; do not re-audit.

> ⚠ Branch protocol — claim a sub-batch by setting `Owner: claude · Status: in-progress · Branch: pos/wave-41a-...` on its line before any edit. One sub-batch at a time. Commit + push every change (founder monitors via GitHub).

### Phase A — Live UX honesty (no Supabase needed)

- **41a — Cap discount at subtotal+shipping; inline "capped to total" hint** *(finding L1)* — **done · see Done section.**

- **41b — Mark mock admin Approve/Reject as "(awaiting DD-26)"** *(finding L3)* — **done · see Done section.**

- **41c — `validateSplits` rejects negative line amounts** *(finding L6)* — **done · see Done section.**

- **41d — Verify `src/proxy.ts` actually runs on every request** *(finding L4)* — **done · see Done section.**

- **41e — orphan-user → redirect to `/onboarding` in `/app` layout** *(finding L5)* — **done · see Done section.**
  - Status: `planning`. **Founder sign-off required** before code change.

- **41f — App-level `/apply` rate limit + de-oracle the duplicate-email path** *(finding L2)* — **done · see Done section.**

### Phase B — `create_order` pre-flight guards (latent — SQL-only, no Supabase needed to ship code)

- **41g — Require `payments[]` when `payment_method=mixed`; validate sum** *(findings D1, D2)* — **done · see Done section.**

- **41h — Cap `discount_satang` inside `create_order` at subtotal+shipping** *(finding D3)* — **done · see Done section.**

- **41i — Remove dead `CASE` on `payment_status`** *(finding D4)* — **done · see Done section.**

### Phase C — Registration-token hardening (latent — SQL-only)

- **41j — Collapse `claim_registration_token` error codes; tighten generator floor** *(findings D5, D6)* — **done · see Done section.**

### Phase D — Regression suite + close-out

- **41k — Vitest D-series regression suite** *(new)* — **done · see Done section.**

- **41l — Wave 41 ADR + memory + post-mortem** *(new)* — **done · see Done section.**

### Suggested execution order

41a → 41b → 41c → 41d → 41e (decide) → 41f → 41g → 41h → 41i → 41j → 41k → 41l. The Phase A items are independent and could parallel if multiple agents run, but the protocol is one-at-a-time.

### Out of scope (deliberately)

- DD-15 / DD-16 / DD-26 themselves — those are Supabase-backed and wait on B-1.
- Performance/index work on `event_inventory` and `orders` — different audit.
- Mochi UI parity for any new components introduced here (41b's disabled-button state must still use Mochi tokens).
- Anything in the MeowMeow Event POS at the repo root (different protocol; off-limits from this wave's branches).

## Wave 56 — Customers page wired to Supabase *(in-review — PR #137)*

- **Owner:** claude · **Branch:** `pos/wave-56-customers-live` · **Claimed:** 2026-05-27

`CustomersConfiguredServer` server component queries `orders` + `order_items` to build phone-keyed customer rows: lifecycle stage (new/returning/vip/dormant), lifetime spend (satang), top SKU, days-since-last-order. Stage filter via `?stage=` URL param. `Date.now()` computation lives in module-level `loadCustomers()` (avoids `react-hooks/purity`). Demo fallback unchanged.

---

## Wave 55 — App audit log wired to Supabase *(done — 2026-05-27 · PR #135)*

`AuditLogConfiguredServer` server component queries `audit_logs` filtered by `workspace_id`, with optional `?action=` filter. Shows pill-coded action type, target, timestamp, and human-readable summary. Limit 150 entries. Demo fallback (`AuditLogList`) unchanged.

---

## Wave 54 — i18n chrome keys: events + close-day *(done — 2026-05-27)*

Added `chrome.events` and `chrome.closeDay` keys to `dictionaries.ts` (EN + TH). Layout `app/app/layout.tsx` now uses `t.chrome.events` and `t.chrome.closeDay` instead of hardcoded English strings.

---

## Wave 51 — Demo-sprint polish *(done — 2026-05-27 · PRs #109–#116)*

Eight-PR sprint to make the app demo-ready before the first customer walkthrough. All CI green, all squash-merged to main.

- **Wave 51a** (`7352718` / PR #109) — gated stale demo-mode notes behind `!isConfigured()` on audit-log + settings pages.
- **Wave 51 Supabase wiring** (`36c05f8` / PR #110, Codex) — `lib/dashboard/queries.ts` (server-only; `getTodayStats`, `getRevenueByDay`, `getPaymentBreakdown`, `getTopProducts`, `getLiveStock`; Bangkok TZ); `DashboardConfiguredServer` async server component; `page.tsx` routes configured→`DashboardConfiguredServer`, demo→`DashboardLive`.
- **Wave 51b** (`88e304a` / PR #111) — removed cat/pet-specific copy from `dictionaries.ts` (EN+TH): "cat-product booths"→"event booths", "Pet Expo" removed, "cat niche"→"booth sellers", "Cat Booth POS"→"Booth POS".
- **Wave 51c** (`dfcc980` / PR #112) — deleted dead `DashboardConfigured.tsx` (unreachable after #110); fixed `CustomerInfoBlock.tsx` `useEffect+setState`→`useMemo` for `match` (pure derived state, one lint warning gone).
- **Wave 51d** (`d561c32` / PR #113) — gated pre-orders demo note behind `!isConfigured()`.
- **Wave 51e** (`5aa0349` / PR #114) — updated stale onboarding password-step copy: "Google sign-in arrives at launch…" → "If you have an invite code, use the invite link instead — it sets up your workspace via Google sign-in automatically."
- **Wave 51f** (`372a60c` / PR #115) — added Events tile to `/app` home page (products → events → POS setup sequence now visible); added `.loop-agent/**` to `eslint.config.mjs` `globalIgnores` (Codex working dir was producing 174 lint errors blocking pre-push hook).
- **Wave 51g** (`8ca1ace` / PR #116) — polished live dashboard header: "Mochi POS live"→"Live dashboard"; "Real Supabase data for your active workspace."→"Your workspace sales, updated in real time."

Demo golden path after this sprint: landing → apply → invite link → Google sign-in → workspace → catalog (products) → events (allocate stock) → POS (create sale) → receipt → dashboard (live Supabase data). Zero TS errors; 20 lint warnings all intentional (localStorage hydration, `react-hooks/set-state-in-effect` set to `warn`).

## Wave 42 — Auth-error guard *(done — merged 2026-05-24 · `ea6d512` / PR #105)*

Closed the one Medium follow-up from the Wave 41 Codex post-hoc review (a Supabase query error masquerading as onboarding-incomplete). Full result in the **Done** section below.

## Event-setup follow-ups (post-PR #83, merged 2026-05-22 · `5999982`)

`/app/events` shipped as a **demo/config screen only.** ⚠️ The booth-rule toggles and the free-gift rule **persist to localStorage but are NOT enforced in POS checkout** — they do not yet control any selling behavior. Treat it as planning/setup UI, not an operational control system.

- **F1 — Beautify `/app/events`** to match the merged UI polish (PR #84/#85): elevation tokens (`shadow-rest`/`shadow-lift`), hover/press micro-interactions, `font-extrabold tracking-tight` page title, unified input focus rings, `ListSkeleton` loading, illustrated empty states. *UI-only; mirrors the beauty pass.* Status: `planning`.
- **F2 — Wire event-setup rules into POS checkout** so the booth-rule toggles (Send Later, QR pet reg, offline, cash drawer) and the free-gift rule actually affect the cart/sale flow. *Behavioral — needs founder sign-off on the free-gift semantics first.* Status: `planning`.
- **F3 — Persist event setup to Supabase** (`events` + `event_inventory`) instead of demo/localStorage, when real event operations need it. *Blocked on B-1 (Supabase), like the rest of Phase 4+.* Status: `blocked`.

## What landed in this initial run (Phase 0 + part of Phase 1)

| Batch | Status | Notes |
|---|---|---|
| DD-01 | done | Planning docs in `docs/`, plus `CLAUDE.md`, `TASKS.md`, `README.md`. |
| DD-02 | done | `npx create-next-app@latest pos-for-sell` — Next 16.2.4, React 19.2.4, TS 5, Tailwind 4. |
| DD-03 | done | Strict TS via scaffold defaults. Path alias `@/*`. Lint clean. (Prettier deferred — eslint w/ next config provides format-on-save guidance.) |
| DD-04 | done | meowmeow palette mapped via `@theme inline` in `globals.css`. Dark mode removed. |
| DD-05 | done (partial) | Layout root with light gradient background + `font-sans` + `min-h-dvh`. Top-bar component deferred until /app routes exist (DD-43+). |
| DD-06 | done | `database/schema.sql` — 13 tables + helper functions. |
| DD-07 | done | `database/rls-policies.sql` — full policy set; mutations gated by role helpers. |
| DD-08 | done | `database/seed.sql` — picks first auth.users row as admin + workspace owner; seeds 5 demo products + 1 demo event. |
| DD-09 | done | `src/lib/database.types.ts` — hand-written, matches schema. Replace with `supabase gen types typescript` later. |
| DD-10 | done | `src/lib/supabase/{client,server,admin,middleware}.ts` + `src/middleware.ts`. |
| DD-11 | done | `src/lib/email/resend.ts` + `templates/{new-application,invite}.ts`. |
| DD-12 | done | `.env.example` + setup section in `README.md`. |
| DD-13 | done | `src/app/page.tsx` marketing landing. |
| DD-14 | done | `src/app/apply/{page,Form,schema,actions}.tsx` — full form + zod + RHF + action ready. |
| DD-18 | done | `/apply/success`. |
| DD-22 | done | Form is mobile-responsive by default (form fields stack, no horizontal overflow). Manual iPhone-SE check still owed. |
| DD-23 | partial | `src/lib/auth/admin-check.ts` + `src/app/admin/layout.tsx`. Returns three failure modes (not-configured, not-authed, not-admin) and redirects appropriately. `force-dynamic` set so auth runs per request. |
| DD-24 | partial | `src/app/admin/applications/page.tsx` queries Supabase; renders error gracefully when not configured. Approve/reject buttons not yet wired (DD-26). |
| DD-43 | partial | `src/app/app/setup/products/page.tsx` empty-state UI with "+ Add product" disabled CTA. Modal arrives at DD-44. |
| DD-55 | partial | `src/app/app/pos/{ProductCard,ProductGrid}.tsx` against mock data. Visual parity with meowmeow product card (image fallback, SKU chip, stock chip with low/soldout states, price). |
| DD-56 | partial | `src/app/app/pos/{POSWorkspace,CartPanel}.tsx` — sticky 440px right panel on desktop, bottom drawer on mobile. |
| DD-57 | partial | `src/lib/pos/cart-store.tsx` — React context + useReducer; ADD/SET_QTY/REMOVE/SET_FULFILLMENT/CLEAR/SET_PAYMENT_METHOD/SET_DISCOUNT/SET_CUSTOMER actions. |
| DD-58, 59, 60, 61 | partial | `CartLine.tsx` + `CartPanel.tsx` — qty +/-, remove (X button), subtotal/shipping/discount/total in summary, discount input with 0/50/100 presets. |
| DD-62 | partial | `PaymentPicker.tsx` — 5 methods, brown gradient active state. |
| DD-64 | partial | `ReviewModal.tsx` — visual review screen, mock confirm. Real `create_order` RPC arrives at DD-65. |

Plus also done:
- `/app/layout.tsx` with three-mode auth gate (configured / demo / no-auth) and demo-mode banner. `force-dynamic` set.
- `/app/page.tsx` home with 4 tiles (POS, Products, Dashboard, Send-later).
- `src/proxy.ts` (replacing `src/middleware.ts`) per Next 16 deprecation.
- `src/lib/money/format.ts` — formatTHB / formatTHBWithUnit / bahtToSatang.

## Phase 0 — Foundation (DD-01 → DD-12)

### DD-01 — Repo + stack decision docs
- **Owner:** claude
- **Status:** done
- **Notes:** Initial planning corpus written under `docs/`, plus `CLAUDE.md`, `TASKS.md`, `README.md`. Authored by Claude in solo mode at user request to plan + execute end-to-end. Codex review of phase boundaries welcome.

### DD-02 — Next.js scaffold
- **Owner:** claude
- **Status:** done
- **Notes:** `npx create-next-app@latest pos-for-sell` with TS + Tailwind v4 + App Router + src dir + ESLint + npm + Turbopack. Next 16.2.4 + React 19.2.4. `npm run dev` works.

### DD-03 — Project conventions
- **Status:** done
- **Notes:** Strict TS via scaffold defaults. Path alias `@/*`. Lint clean. Prettier deferred — eslint w/ next config provides format-on-save guidance. (Synced with top-of-file "What landed" table 2026-05-18.)

### DD-04 — Theme tokens
- **Status:** done
- **Depends on:** DD-03
- **Notes:** meowmeow palette mapped via `@theme inline` in `globals.css`. Dark mode removed.

### DD-05 — Layout shell
- **Status:** done (partial)
- **Depends on:** DD-04
- **Notes:** Layout root with light gradient background + `font-sans` + `min-h-dvh`. Top-bar component deferred until /app routes exist (DD-43+).

### DD-06 — Database schema SQL
- **Status:** done
- **Notes:** `database/schema.sql` — 13 tables + helper functions. *Applying* the SQL to a live Supabase project remains blocked on B-1 (Supabase project not created).

### DD-07 — RLS policies SQL
- **Status:** done
- **Depends on:** DD-06
- **Notes:** `database/rls-policies.sql` — full policy set; mutations gated by role helpers.

### DD-08 — Seed SQL
- **Status:** done
- **Depends on:** DD-06, DD-07
- **Notes:** `database/seed.sql` — picks first auth.users row as admin + workspace owner; seeds 5 demo products + 1 demo event.

### DD-09 — Database TypeScript types
- **Status:** done
- **Depends on:** DD-06
- **Notes:** `src/lib/database.types.ts` — hand-written, matches schema. Replace with `supabase gen types typescript` later.

### DD-10 — Supabase client libs
- **Status:** done
- **Depends on:** DD-09
- **Notes:** `src/lib/supabase/{client,server,admin,middleware}.ts` + `src/middleware.ts` (now `src/proxy.ts` per Next 16 deprecation).

### DD-11 — Resend email lib
- **Status:** done
- **Notes:** `src/lib/email/resend.ts` + `templates/{new-application,invite}.ts`.

### DD-12 — Env management + setup README
- **Status:** done
- **Depends on:** DD-10, DD-11
- **Notes:** `.env.example` + setup section in `README.md`.

## Phase 1 — Public application flow (DD-13 → DD-22)

### DD-13 — Marketing landing /
- **Status:** done
- **Depends on:** DD-05
- **Notes:** `src/app/page.tsx` marketing landing.

### DD-14 — /apply form UI
- **Status:** done
- **Depends on:** DD-05
- **Notes:** `src/app/apply/{page,Form,schema,actions}.tsx` — full form + zod + RHF + action ready.

### DD-15 — /apply server action (insert applications)
- **Status:** blocked
- **BlockedBy:** Supabase project URL + anon key + service role key.
- **Depends on:** DD-10, DD-14

### DD-16 — /apply spam protection
- **Status:** blocked
- **BlockedBy:** Supabase project (rate-limit table) or Vercel KV.
- **Depends on:** DD-15

### DD-17 — /apply admin notification email
- **Status:** blocked
- **BlockedBy:** Resend API key + admin email address.
- **Depends on:** DD-11, DD-15

### DD-18 — /apply success page
- **Status:** done
- **Depends on:** DD-14
- **Notes:** `/apply/success`.

### DD-19 — /apply/status check
- **Status:** blocked
- **BlockedBy:** Supabase project.
- **Depends on:** DD-15

### DD-20 — TH/EN toggle on public pages
- **Status:** done
- **Notes:** Shipped via Wave 19 (EN/TH bilingual UI). `LanguageSwitcher` + `getDict()` on `/` and `/apply` with `t.landing.*` strings; POS chrome translated too.

### DD-21 — Form analytics
- **Status:** blocked
- **BlockedBy:** analytics provider choice (Plausible, Vercel Analytics, PostHog).

### DD-22 — /apply mobile responsive pass
- **Status:** done
- **Depends on:** DD-14
- **Notes:** Form is mobile-responsive by default (form fields stack, no horizontal overflow). Manual iPhone-SE check still owed.

## Phase 2 — Admin approval (DD-23 → DD-32)

All Phase 2 batches require Supabase. Status: **blocked** until DD-15 unblocks.

| Batch | Status | BlockedBy |
|---|---|---|
| DD-23 — Admin auth gate | blocked | Supabase Auth |
| DD-24 — /admin/applications list | blocked | Supabase |
| DD-25 — Application search | blocked | Supabase |
| DD-26 — Approve/reject | ready-for-review | `pos/DD-26-approve-generate-invite` — `approve_application`/`reject_application` RPCs + wired buttons (issue #20) |
| DD-27 — Generate invite code | ready-for-review | minted atomically inside `approve_application` (TS generator → RPC) — same branch |
| DD-28 — Invite email | ready-for-review | best-effort Resend send on approve (gated on `RESEND_API_KEY`) — same branch |
| DD-29 — /admin/invite-codes list | done | `src/app/admin/invite-codes/page.tsx` (read-only list). |
| DD-30 — Resend invite | blocked | Supabase + Resend |
| DD-31 — Cancel invite | blocked | Supabase |
| DD-32 — Admin audit logging | blocked | Supabase |

## Phase 3 — Registration + workspace (DD-33 → DD-42)

All blocked on Supabase.

## Phase 4 — Product setup (DD-43 → DD-54)

UI scaffolds (DD-43, DD-44 layout-only) are unblocked. Persistence (DD-45+) blocked on Supabase Storage.

## Phase 5 — POS core (DD-55 → DD-74)

UI translation from meowmeow (DD-55 → DD-64) is mostly unblocked (data via mocks). Real persistence (DD-65 onward) blocked.

## Phase 6 — Send-later (DD-75 → DD-84)

All blocked on Phase 5.

## Phase 7 — Dashboard + end-of-day (DD-85 → DD-94)

All blocked on Phase 5.

## Phase 8 — Polish + pilot readiness (DD-95 → DD-100)

All blocked on prior phases.

## Blockers (what unblocks the next batches)

### B-1 — Supabase project (BLOCKS: DD-15, DD-16, DD-17, DD-19, all of Phase 2/3/4 onwards)

The user must:

1. Go to https://app.supabase.com → **New project**.
2. Name: `mochipos` (or similar). Region: closest to Bangkok (`Singapore` is fine).
3. From `Settings → API`, copy the three keys into `.env.local` (already scaffolded at repo root; git-ignored):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
4. In the SQL editor, paste-and-run each file **in this order**:
   - `database/schema.sql` — full current schema (tables + helper functions `is_admin` / `is_workspace_member` / `touch_updated_at`).
   - `database/functions/*.sql` — the **8 security-definer RPCs** (`create_order`, `void_order`, `correct_order`, `redeem_invite_code`, `create_registration_token`, `claim_registration_token`, `convert_event_to_sample`, `convert_sample_to_event`). All `create or replace`, so order among them is irrelevant — but RLS routes order/audit writes **through** these, so don't skip them.
   - `database/rls-policies.sql` — RLS (uses `drop policy if exists`, safe to re-run).
   - (optional) `database/seed.sql` — **only after** signing up one Auth user via the app. It promotes the first `auth.users` row to admin + demo-workspace owner, and self-guards (no-ops with a notice) if no user exists yet.
   - **Do NOT run `database/migrations/`** on a fresh DB — `schema.sql` is the source of truth and already includes both migrations (`sample_qty`, customer-portal tables). Migrations exist only to move an *existing* DB forward.
5. In `Authentication → Providers`, ensure **Email** is enabled with password sign-in.
6. In `Storage`, create two buckets:
   - `product-images` — public read.
   - `payment-slips` — private (signed URLs only).

### B-2 — Resend account (BLOCKS: DD-17, DD-28, DD-30, DD-82, all transactional email)

The user must:

1. Go to https://resend.com → sign up.
2. `API Keys → Create API Key` → copy into `.env.local` as `RESEND_API_KEY`.
3. Choose a **From** address. For testing without domain verification, use `onboarding@resend.dev`. For production, verify a domain (e.g. `noreply@yourbrand.com`) via Resend's DNS instructions.
4. Set `EMAIL_FROM` and `ADMIN_EMAIL` in `.env.local`.

### B-3 — Vercel (BLOCKS: any deploy; not blocking local dev)

Optional until first deploy. When ready:

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. https://vercel.com → Import Project → select the repo.
3. Set **Root Directory** to `pos-for-sell`.
4. Copy the four env vars from `.env.local` into Vercel's Project Settings → Environment Variables.
5. Deploy. The first build pulls the same Tailwind+Next 16 stack.

### B-4 — Domain (deferred)

Optional. Vercel gives a `*.vercel.app` URL. Custom domain happens after pilot launch.

### B-5 — Sentry / PostHog / Plausible (BLOCKS: DD-21, DD-98)

Pick one provider for analytics + error tracking; defer until Phase 8.

## Done

(Move completed batches here with the merging commit SHA.)

### DD-55–66 — Real POS sale (live catalog → create_order → atomicity) ⭐ arc destination
- **Merged:** 2026-05-25 · `ba53cbc` (PR #9)
- **Result:** `/app/pos` (configured) loads the active event (latest `planned`/`running`) + its allocated active products (`current_qty` from `event_inventory`) and sells from real data (DD-55–64). "Confirm sale" → `submitOrder` Server Action → the **`create_order`** RPC (DD-65): the cashier sends only intent (lines/payment/splits/customer), `workspace_id` is resolved server-side (never trusted from the client), and the RPC owns prices/stock/totals, writing `orders`/`order_items`/`payment_records`/`send_later_orders`/`audit_logs` and decrementing `event_inventory` atomically (`FOR UPDATE` + insufficient-stock guard = DD-66; Wave 41-hardened). Pure `buildCreateOrderPayload` (+4) + end-to-end pglite coverage through the builder (decrement/`sold_qty`, oversell rollback, exhaust-then-refuse; +3). `POSMode` context routes demo vs. live; demo path untouched; success page degrades gracefully for a real order id. Deferred: DD-67 real receipt, DD-74 live samples. pglite can't express true two-connection concurrency — the `FOR UPDATE` mechanism is in place; the no-oversell guarantee is pinned sequentially. Suite 469 → 476. CI green.

### Wave 43 — Events + event_inventory foundation
- **Merged:** 2026-05-25 · `70d8e15` (PR #8)
- **Result:** the data spine prerequisite the DD plan assumed. `/app/events` (configured): `createEvent` (status `planned`), `allocateActiveProducts` (idempotent upsert of `event_inventory` from active products at `default_starting_qty`; `ignoreDuplicates` so re-sync never resets current/sold), `setEventStatus` (start/close/reopen) — workspace-scoped + role-gated (events: owner/manager; inventory: owner/manager/stock_staff). `lib/events/parse.ts` (+9 tests) + `canManageEvents`; `EventsManagerLive`; demo `EventSetupClient` stays unconfigured. Gives `create_order` a running event + lockable stock. Suite 460 → 469. CI green.

### DD-43–53 — Product persistence (real `products` table)
- **Merged:** 2026-05-25 · `f6bf29b` (PR #7)
- **Result:** `/app/setup/products` reads/writes the real `products` table when configured (demo localStorage stays for the unconfigured build). `lib/products/parse.ts` (pure validate/normalise → satang ints; +8 tests), `lib/auth/workspace.ts` (`getActiveWorkspace` + `canWriteCatalog`), Server Actions `createProduct`/`updateProduct`/`setProductActive` (workspace-scoped, RLS-enforced, SKU immutable on edit, soft-delete via `is_active`, 23505→"SKU exists"), lean `ProductFormLive` + `CatalogManagerLive` (real-schema columns only — demo's cost/reorder/pins/`current_qty` are demo-only; `current_qty` is per-event `event_inventory`). pglite test pins `(workspace_id, sku)` uniqueness (+3). Covers DD-43/44/47/48/51/52/53. Deferred: DD-45/46 (image→Storage), DD-49 (CSV), DD-50 (categories), DD-54 (setup gate). No audit row on catalog edits (not hard-rule-7 scope; audit INSERT is RPC-only under RLS). Suite 449 → 460. CI green.

### DD-40 — Forgot password / reset flow
- **Merged:** 2026-05-25 · `8443533` (PR #6)
- **Result:** full password-recovery flow. `/login` "Forgot password?" → `/login/forgot` calls `resetPasswordForEmail` (de-oracled — always "sent if it exists"; real error logged) with `redirectTo=/auth/confirm?next=/login/reset`. New `/auth/confirm` Route Handler exchanges the PKCE `code` (or `token_hash`+`type`) for a recovery session, then forwards to a `safeNextPath`-sanitised `next`; on failure → `/login/reset` (shows expired state). `/login/reset` detects the recovery session and renders the new-password form (`updateUser`) → `/app`, else a "request a new link" panel. `passwordReset` i18n (EN+TH); +6 schema tests. Suite 443 → 449. Manual-verify on Vercel: the redirect host must be in Supabase's Redirect-URL allowlist; "old session invalidated" depends on the project's logout-on-password-change setting. CI green.

### DD-33–38 — Invite-redeem register flow
- **Merged:** 2026-05-25 · `11edcfc` (PR #5)
- **Result:** the full path from invite code → live workspace. `/register` step 1 validates the code via a **service-role** lookup (anon can't read `invite_codes` under RLS) gated by the pure `checkInviteUsable` (mirrors the RPC) and returns ONE generic failure (no enumeration oracle; real reason logged). Step 2 collects a workspace slug (pre-filled from brand) + password; `completeRegistration` re-validates invite + slug uniqueness server-side, `admin.createUser({email_confirm:true})` (invite is the verification), signs in, then the `redeem_invite_code` RPC creates the workspace + owner membership transactionally → `/app`. New `lib/auth/invite-status.ts` + `lib/slug isValidSlug` (both mirror the RPC); typed the RPC in `database.types.ts`; `register` i18n (EN+TH). **First** pglite coverage of `redeem_invite_code` (8 cases) — happy path + all guards. Covers DD-33–38. Suite 422 → 443. **Latent finding (pinned, not fixed):** the RPC's `set status='expired'` write rolls back under its own `raise` (cosmetic dead code; functional gate is correct) — cleanup candidate. CI green.

### DD-42 — RLS tenant-isolation test
- **Merged:** 2026-05-25 · `ab89614` (PR #4)
- **Result:** proves hard rules #2/#3 hold — user A can't SELECT user B's workspace data — by running real queries through the shipped RLS policies in pglite. New `bootRlsDb` harness (`tests/db/helpers/pglite.ts`) loads `rls-policies.sql`, creates the `anon`/`authenticated` roles + the grants Supabase provides out-of-band (incl. `usage on schema auth` for `auth.uid()`), plus `actAs`/`actAsSuperuser` (pglite boots as an RLS-exempt superuser, so seeding stays there; isolation is tested as `authenticated`). `tests/db/rls-isolation.test.ts` — 7 cases: two tenants; A & B each see only their own products/workspace/event_inventory; a no-membership user sees nothing; a disable/re-enable control encodes "red without policies, green with them". Test-only (no schema/app change). Suite 415 → 422; CI green.

### DD-41 — Session lifecycle: verify per-request refresh + sign-out
- **Merged:** 2026-05-25 · `4832d1c` (PR #2)
- **Result:** the per-request session-cookie refresh half of DD-41 was already satisfied by `src/proxy.ts` → `updateSession` (`getUser()` revalidates the token every non-asset request; supabase-js rotates the cookies via `setAll`) — verified Wave 41d, shape pinned by `tests/lib/proxy.test.ts`; documented in `middleware.ts`. Completed DD-41 by adding **sign-out**: `signOut` Server Action (`src/app/app/actions.ts`) clears the session (`supabase.auth.signOut()` → `setAll` removes the cookies), `revalidatePath` + `redirect("/login")`, no-ops in demo mode; a **"Sign out"** button in the `/app` header (configured mode only); `chrome.signOut` dict (EN + TH). The login↔logout loop is now whole. typecheck/lint/test (415)/build green; CI green. (Follow-up chore `25432d8`/PR #3: `git add -A` had swept in the scheduler's `.claude/scheduled_tasks.lock` — untracked + gitignored it.)

### DD-39 — /login wired to Supabase Auth
- **Merged:** 2026-05-25 · `3df4bb1` (PR #1) — first PR of the standalone repo; the post-Supabase wire-up arc begins.
- **Result:** replaced the `/login` placeholder with real email + password sign-in. Server Action `signIn` (`src/app/login/actions.ts`) calls `signInWithPassword`, returns one generic "Email or password is incorrect." (no enumeration oracle; the real reason is logged server-side only), then `revalidatePath("/", "layout")` + `redirect(safeNextPath(next))`. New open-redirect guard `src/lib/auth/safe-next.ts` sanitises the `?next=` deep-link target (rejects off-site / protocol-relative / control-char values; falls back to `/app`) — **+8 unit tests** (`tests/lib/safe-next.test.ts`). Client form `LoginForm.tsx` is RHF + zod with an inline `role="alert"` error banner (public-page convention from `/apply`; public pages don't mount `ToastProvider`), bilingual via a new `login` dict block (EN + TH). Page redirects an already-authed user to the safe `next`. Suite **407 → 415**; typecheck/lint/build green; CI green.

### Wave 42 — /app auth-error guard: query error must not masquerade as onboarding-incomplete
- **Merged:** 2026-05-24 · `ea6d512` (PR #105)
- **Result:** the one Medium follow-up from the Wave 41 Codex post-hoc review (which approved both flagged items — pglite + 41e). The `/app` layout discarded the Supabase `error` from the `workspace_members` / `workspaces` lookups (`maybeSingle()` returns `{ data: null, error }` on a transient failure — indistinguishable from "no row" once `error` is dropped), so a provisioned seller hitting a DB blip read as `hasMember=false` and was redirected to `/onboarding` as if orphaned. Fix: `resolveAppGuard` (`src/lib/app-guard.ts`) gains a `queryError` input + a distinct `{ kind: "error" }` decision (precedence: demo → auth → query-error → membership → admit); `src/app/app/layout.tsx` captures the `error` and renders a bilingual, retryable `ErrorState` instead. +4 unit cases (`tests/lib/app-guard.test.ts`, 9 total); suite 403 → 407. Latent until DD-65 wires Supabase. Codex review: **ship** (no blocking issues). Post-hoc note appended to the Wave 41 ADR.

### Wave 41e — /app layout redirects orphan users to /onboarding (finding L5)
- **Merged:** 2026-05-24 · `4481e3e` (PR #104)
- **Result:** founder delegated the call → redirect-to-`/onboarding`. An authenticated user with no `workspace_members` row (or a member row dangling to a missing workspace) now redirects to `/onboarding` instead of dropping into the demo sandbox; demo mode reserved for the `Supabase not configured` pilot path. Decision logic extracted to a pure `resolveAppGuard` (`src/lib/app-guard.ts`) consumed by `src/app/app/layout.tsx`; 5 unit cases in `tests/lib/app-guard.test.ts`. ⚠ auth-gating change — flagged for Codex review. **Wave 41 now fully complete (all 12 sub-batches shipped).**

### Wave 41l — Wave 41 ADR + STATUS wrap-up (Phase D close-out)
- **Merged:** 2026-05-24 · `5639d25` (PR #103)
- **Result:** `docs/adr/2026-05-24-wave-41-hardening.md` records the full sweep (L1–L6 + D1–D6, each decision + PR), the pglite test-infra decision with the Codex post-hoc review flag, consequences, and the 41e open question. `docs/STATUS.md` "Latest waves" appended; test count 263 → 398. Auto-memory entry added linking the audit ledger to the wave. **Wave 41 complete except 41e (deferred — founder sign-off).**

### Wave 41k — D-series regression suite close-out + pglite harness doc (Phase D)
- **Merged:** 2026-05-24 · `0758dff` (PR #102)
- **Result:** closed out the D-series suite. The behavioural D1–D6 tests + pglite harness shipped in 41g–41j; this batch added `tests/db/README.md` (harness rationale: pglite over sql-mock/pgTAP/Docker, the auth + `gen_random_bytes` stubs, stripped SQL, Codex post-hoc review flag), `tests/db/d-series-coverage.test.ts` (guard that fails if any D1–D6 loses its pin), and an `npm run test:db` script. 23 db-layer tests across 3 files, green via `npm test`. **Test-infra decision = pglite** (no Docker); ⚠ flagged for Codex post-hoc review.

### Wave 41j — registration-token de-oracle + generator floor (findings D5, D6)
- **Merged:** 2026-05-24 · `843594f` (PR #101)
- **Result:** D5 — `claim_registration_token` now returns one byte-identical `invalid token` error for not-found / already-claimed / expired (was 3 distinct messages = enumeration oracle); the reason goes to the server log via `RAISE LOG` (an `audit_logs` row would roll back with the failed call). `payload required` stays distinct (not a token oracle). D6 — `create_registration_token` re-rolls when url-unsafe stripping drops below 16 chars instead of shipping a short token (raw entropy raised to 18 bytes). 5 cases in `tests/db/registration_token.test.ts`; D6 repro is deterministic via an injectable `gen_random_bytes` shim (`test.strip_heavy_rolls` GUC).

### Wave 41i — `create_order` removes dead payment_status CASE (finding D4)
- **Merged:** 2026-05-24 · `06f80d6` (PR #100)
- **Result:** the no-op `case when method='sample' then 'paid' else 'paid' end` collapsed to the literal `'paid'`, with a comment noting a future `pending` (awaiting-tender) state belongs to the cashier-flow batch. No behaviour change; 2 characterization cases in `tests/db/create_order.test.ts` pin `payment_status='paid'` for cash + sample orders.

### Wave 41h — `create_order` caps discount_satang at subtotal+shipping (finding D3)
- **Merged:** 2026-05-24 · `8514131` (PR #99)
- **Result:** a client-supplied `discount_satang` above `subtotal+shipping` is now clamped to that ceiling and persisted at the capped value (previously the absurd value poisoned `orders.discount_satang` while only the total clamped to 0). The `audit_logs` breadcrumb records `discount_capped` + the final `discount_satang`. 3 new cases in `tests/db/create_order.test.ts`.

### Wave 41g — `create_order` requires payments for mixed + validates sum (findings D1, D2)
- **Merged:** 2026-05-24 · `5c213c2` (PR #98)
- **Result:** D1 — `payment_method=mixed` with empty/missing `payments[]` now raises instead of recording a completed "paid" order with zero payment records. D2 — a supplied `payments[]` must sum to the order total; mismatch raises naming the off-by satang amount. Sample (free) and single-tender auto-record paths unchanged. **Test infra:** adopted **pglite** (Postgres-in-WASM, no Docker) over the 41k `sql-mock` default so plpgsql executes for real — new reusable harness `tests/db/helpers/pglite.ts` (auth stub + schema/function loader + workspace seeder) is the foundation for 41k. 6 cases in `tests/db/create_order.test.ts`. ⚠ pglite-vs-sql-mock choice flagged for Codex post-hoc review (the 41k note asked for review before 41g; proceeded under the founder's run-non-stop directive).

### Wave 41f — App-level `/apply` rate limit + de-oracle duplicate email (finding L2)
- **Merged:** 2026-05-24 · `5bdf48d` (PR #97)
- **Result:** new `src/lib/rate-limit/` — pure sliding-window `checkRateLimit(store, key, now, {max, windowMs})` (mutates the store only on allowed hits; exclusive window boundary) plus a Server Action bridge `checkApplyRateLimit` keyed by IP + sha256(email), permissive under `VITEST`. The `/apply` action now gates on 5 submissions per IP+email per hour before insert. Separately, the duplicate-email `23505` path now returns the same generic success result as a new submission, closing the enumeration oracle (applicants still check progress at `/apply/status`). 6 new unit tests in `tests/lib/rate-limit.test.ts`. In-process bridge for the pilot; DD-16 ships the shared Supabase-backed version. Note: kept to the codebase's pure-function test convention (zero `vi.mock`), so the de-oracle is a reviewed 4-line edit rather than a mock-heavy action test.

### Wave 41b — Mock admin Approve/Reject honesty (finding L3)
- **Merged:** 2026-05-24 · `616c471` (PR #96)
- **Result:** the Approve/Reject buttons no longer fire "Approved (mock)" / "Rejected (mock)" success toasts. Toast content moved to a new pure module `src/lib/admin/applications-pending.ts` (kind="info", title "Not yet wired — DD-26", message explains nothing changed and points to TASKS.md / DD-26). A small warn-toned "Awaiting DD-26 wire-up" caption now sits beside the buttons so admins see the state before clicking. 6 unit tests pin the toast content. When DD-26 lands, the pending module gets deleted and `Actions.tsx` re-points its toast helper at the real server-action result.

### Wave 41c — `validateSplits` rejects negative line amounts (finding L6)
- **Merged:** 2026-05-24 · `e57ae94` (PR #95)
- **Result:** added a `negative` reason to `validateSplits` that runs before the empty/short/over checks (since `splitsTotal` clamps negatives to 0, a negative line beside a balancing positive would otherwise validate clean). `offBy` reports the absolute value of the most-negative line so the cashier can locate the bad row. UI: `SplitPaymentBlock` now renders the danger tone + a localised "Negative amount: −X" chip (en + th). 4 new test cases pin the boundary.

### Wave 41a — Cap discount at subtotal+shipping; inline "capped" hint (finding L1)
- **Merged:** 2026-05-24 · `4cd4165` (PR #94)
- **Result:** new pure `capDiscount(typedSatang, maxSatang) → {satang, capped}` in `lib/pos/calc.ts`; `DiscountInput` in CartPanel now passes `subtotal+shipping` as max, dispatches the capped value, and shows an inline warn-toned "Capped at X THB (cart total)" hint when the user typed more than the ceiling. Presets also go through the cap (safe — they're small). 7 new unit tests covering the boundary (zero, exact, over-by-one, wildly-over, negative, zero-max). Receipt now records the capped value, not the absurd one.

### Wave 41d — Verify `src/proxy.ts` runs on every request (finding L4)
- **Merged:** 2026-05-24 · `a6a3df2` (PR #93)
- **Result:** verified working. Next 16 + Turbopack honours the named `export async function proxy(...)`. Real registration lives in `.next/server/functions-config-manifest.json` under `/_middleware`; the legacy `middleware-manifest.json` is emitted empty in Turbopack builds — that was the red herring. Pinned by `tests/lib/proxy.test.ts` (5 tests: 3 unit shape + 2 build-output integration). Code-change: a 4-line comment in `src/proxy.ts` documenting the verification so future readers don't re-investigate.

### Wave 39a — Sample bucket data layer (schema + RPCs + types)
- **Merged:** 2026-05-07 · `6455917` (PR #4)

### Wave 40a — Customer Portal data layer (5 tables + 2 RPCs + RLS)
- **Merged:** 2026-05-07 · `2c5d908` (PR #5)

### Wave 40b — Customer Portal UI (demo mode)
- **Merged:** 2026-05-07 · `56f743d` (PR #6)

### Wave 40c — Cashier repeat-customer lookup (demo mode)
- **Merged:** 2026-05-07 · `4522862` (PR #9 — recovered after PR #7 was orphaned by squash-merge of base branch; cherry-pick onto fresh main per `skill.md` § 13)

### Wave 39b — Sample bucket UI (demo mode)
- **Merged:** 2026-05-07 · `e9cab46` (PR #8)
