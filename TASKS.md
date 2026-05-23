# TASKS — pos-for-sell SaaS

Live status board for the 100-batch plan in [docs/BATCH_PLAN.md](docs/BATCH_PLAN.md).

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

_None claimed in the DD-XX board. The project is in **Wave mode** (post-DD-100 organic work); the current effort is the **Mochi indigo design rebrand** (PR #73, branch `pos/mochi-design-foundation`) — see [docs/MOCHI_ROLLOUT.md](docs/MOCHI_ROLLOUT.md) and [docs/STATUS.md](docs/STATUS.md). Waves 39a/39b/40a/40b/40c merged 2026-05-07 (see **Done**)._

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

- **41e — ADR: orphan-user → demo-mode behavior in `/app` layout** *(finding L5)*
  - Why: today an authenticated user with no `workspace_members` row falls into demo mode showing localStorage data. Post-Supabase that's surprising: a removed seller would still see (their own) demo data. Decision needed: keep as feature, or redirect to `/onboarding`.
  - Touched: `docs/adr/2026-05-XX-orphan-user-demo-mode.md` (new); possibly `src/app/app/layout.tsx`.
  - Done when: ADR records the decision with reasoning; if "redirect to /onboarding", layout change + test ships in same PR.
  - Status: `planning`. **Founder sign-off required** before code change.

- **41f — App-level `/apply` rate limit + de-oracle the duplicate-email path** *(finding L2)* — **done · see Done section.**

### Phase B — `create_order` pre-flight guards (latent — SQL-only, no Supabase needed to ship code)

- **41g — Require `payments[]` when `payment_method=mixed`; validate sum** *(findings D1, D2)* — **done · see Done section.**

- **41h — Cap `discount_satang` inside `create_order` at subtotal+shipping** *(finding D3)* — **done · see Done section.**

- **41i — Remove dead `CASE` on `payment_status`** *(finding D4)*
  - Why: `case when v_payment_method = 'sample' then 'paid' else 'paid' end` — both branches return `'paid'`. Refactor leftover. Either keep literal `'paid'` or restore the intended branch (likely `'pending'` for non-sample cash awaiting tender confirm).
  - Touched: `database/functions/create_order.sql`.
  - Done when: dead CASE is gone; behaviour either documented as identical (literal) or intentionally split. Single-commit.
  - Status: `planning`.

### Phase C — Registration-token hardening (latent — SQL-only)

- **41j — Collapse `claim_registration_token` error codes; tighten generator floor** *(findings D5, D6)*
  - Why: today `claim_registration_token` raises distinct exceptions for "token not found" / "already claimed" / "expired" — enumeration oracle for valid tokens. `create_registration_token` may emit short tokens when `gen_random_bytes` yields many strip-chars.
  - Touched: `database/functions/claim_registration_token.sql`, `database/functions/create_registration_token.sql`.
  - Done when: all token-failure paths return a single generic "invalid token" error (with internal logging preserved via `audit_logs` row for ops); generator re-rolls until length ≥ 16.
  - Status: `planning`.

### Phase D — Regression suite + close-out

- **41k — Vitest D-series regression suite** *(new)*
  - Why: each D-finding gets a failing test that pins the fix. Without this, future schema edits can silently regress.
  - Touched: `tests/db/create_order.spec.ts`, `tests/db/registration_token.spec.ts`, possibly `vitest.config.ts` (include `tests/db/**`).
  - Decision needed: SQL-mock vs Dockerised Postgres vs pgTAP. Default to **sql-mock** (no infra dep) unless 41g–41j need DB-side behavior (then introduce a `vitest.db.config.ts` with a docker-compose Postgres). Codex review on this choice before 41g starts.
  - Done when: 6+ tests covering D1–D6, all green, runnable via `npm test`.
  - Status: `planning`. Blocks final merge of 41g–41j.

- **41l — Wave 41 ADR + memory + post-mortem** *(new)*
  - Why: future agents shouldn't re-audit. Pin the breadcrumb.
  - Touched: `docs/adr/2026-05-XX-wave-41-hardening.md`, plus a memory entry linking the audit ledger to the wave.
  - Done when: ADR landed, memory updated, [STATUS.md](docs/STATUS.md) "Latest waves" appended.
  - Status: `planning`.

### Suggested execution order

41a → 41b → 41c → 41d → 41e (decide) → 41f → 41g → 41h → 41i → 41j → 41k → 41l. The Phase A items are independent and could parallel if multiple agents run, but the protocol is one-at-a-time.

### Out of scope (deliberately)

- DD-15 / DD-16 / DD-26 themselves — those are Supabase-backed and wait on B-1.
- Performance/index work on `event_inventory` and `orders` — different audit.
- Mochi UI parity for any new components introduced here (41b's disabled-button state must still use Mochi tokens).
- Anything in the MeowMeow Event POS at the repo root (different protocol; off-limits from this wave's branches).

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
| DD-26 — Approve/reject | blocked | Supabase |
| DD-27 — Generate invite code | blocked | Supabase |
| DD-28 — Invite email | blocked | Supabase + Resend |
| DD-29 — /admin/invite-codes list | blocked | Supabase |
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
2. Name: `pos-for-sell` (or similar). Region: closest to Bangkok (`Singapore` is fine).
3. From `Settings → API`, copy the three keys into `pos-for-sell/.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
4. Open the SQL editor, run in this order:
   - `pos-for-sell/database/schema.sql`
   - `pos-for-sell/database/rls-policies.sql`
   - (optional) `pos-for-sell/database/seed.sql` — only after creating one Auth user via the app.
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
