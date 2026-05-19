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

_None — Waves 39a, 39b, 40a, 40b, 40c all merged 2026-05-07. See **Done** section below._

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
- **Status:** ready-for-claude

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
