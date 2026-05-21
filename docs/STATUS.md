# Status — pos-for-sell

Rolling snapshot. The "What's live" section below is the original 2026-05-04 baseline (end of the credential-free build sprint); the "Latest waves" section near the bottom tracks newer work appended per wave. Last meaningful update: 2026-05-21 (Mochi indigo design rebrand — PR #73).

## What's live

- **Build**: 29 routes (`page.tsx` files in `src/app/`). Static where appropriate, dynamic for auth-gated layouts.
- **Tests**: 304 unit tests across 34 files all pass — re-verified 2026-05-21 (`npm test`, 1.8s). Pure-logic libs only; no Supabase, no browser.
- **No external creds yet** — every Supabase / Resend touch degrades to mock data with a "Demo mode" badge.

## Routes

29 routes total (verified 2026-05-18 by `find src/app -name page.tsx | wc -l`). Status legend: **live** = real page; **wired** = real impl with optional Supabase; **demo** = full UI on localStorage; **mock** = real UI on mock data; **placeholder** = stub page saying "not yet built"; **gated** = checks for auth/config.

| Path | Status | Notes |
|---|---|---|
| **Public** | | |
| `/` | live | marketing landing |
| `/apply` | wired | form + server action; writes to `applications` when env present |
| `/apply/success` | live | post-submit screen |
| `/apply/status` | live | i18n status copy; real DB lookup deferred to a future wave |
| **Seller onboarding** | | |
| `/login` | **placeholder** | "DD-39 will wire this page to Supabase Auth" |
| `/register` | **placeholder** | "DD-33..38 will wire the invite-redemption flow" |
| **Founder learning** | | |
| `/learn` | live | curriculum landing (PR #15) |
| **Admin (gated)** | | |
| `/admin` | gated | three failure modes: not-configured, not-authed, not-admin |
| `/admin/applications` | wired | live query + graceful fallback |
| `/admin/invite-codes` | wired + mock | mock fallback when no creds |
| `/admin/workspaces` | wired + mock | same |
| `/admin/audit-log` | wired + mock | same |
| `/admin/pilot-status` | mock-only | DD-100 makes it live |
| **Cashier app (gated)** | | |
| `/app` | gated + demo | demo banner when no creds; seller home with tiles |
| `/app/pos` | demo | full POS, mock catalog, full cart UX, search, payment picker |
| `/app/pos/success/[orderId]` | demo | success screen + PromptPay QR + Customer Portal token (Wave 8 + 40b) |
| `/app/dashboard` | demo | multi-period dashboard, 10+ tiles (Wave 29/34) |
| `/app/customers` | demo | auto-derived from past sales with lifecycle stage (Wave 38) |
| `/app/correction` | demo | bill-correction flow (`correct_order` analog) |
| `/app/audit-log` | demo | activity history (Wave 18) |
| `/app/close-day` | demo | cash reconciliation (Wave 25) |
| `/app/send-later` | demo | pending fulfillments, status flow (Wave 16/17) |
| `/app/stock-count` | demo | walk-the-warehouse recount with variance (Wave 33) |
| `/app/pre-orders` | demo | sold-out pre-orders (Wave 31) |
| `/app/inventory/samples` | demo | sample bucket Make / Return (Wave 39b) |
| `/app/settings` | demo | workspace settings |
| `/app/setup/products` | demo | catalog CRUD with image upload (Wave 13/14) |
| **Customer-facing** | | |
| `/qr-menu` | demo | customer-facing menu via QR (Wave 27) |
| `/register/[token]` | demo | post-purchase pet-profile claim form (Wave 40b) |

## Libraries

`src/lib/` (19 modules; verified 2026-05-18):

- **Supabase / data**: `supabase/{client,server,admin,middleware}.ts`, `database.types.ts` (hand-rolled; regen later).
- **Auth**: `auth/admin-check.ts` — three-mode admin gate.
- **POS logic**: `pos/` — cart store, calc, splits, types, upsell.
- **Money**: `money/format.ts` — formatTHB, satang ↔ baht.
- **Payment**: `promptpay/` — EMVCo payload + CRC16.
- **i18n**: `i18n/` — EN/TH dictionaries + server/client providers (Wave 19).
- **Hooks**: `hooks/` — useDebouncedValue, useLocalStorageState.
- **Email**: `email/` — Resend wrapper + templates (new-application, invite).
- **Demo stores**: `demo/` — localStorage stand-ins for catalog, sales, customers, pets, sample bucket, close-day, etc. (30+ files; one per concept Supabase will own).
- **Utilities**: `cn.ts` (classnames), `csv/` (RFC 4180), `date/` (TH timezone + eventDayIndex), `image/compress.ts` (WebP), `invite-code/` (ambiguity-safe generator), `order-number/` (sequence formatter), `phone/` (TH normalizer), `sku/` (validator), `slug/` (URL slug + candidates).

## Components

`src/components/`:

- `ui/` — Button, TextInput, NumberInput, Textarea, Select, Checkbox, Radio, Modal, Toast, Pill, States (Skeleton, EmptyState, ErrorState).
- `LanguageSwitcher.tsx` — EN/TH toggle (Wave 19).
- `Money.tsx` — formatted THB display.

## Database

`pos-for-sell/database/`:

- `schema.sql` — **18 tables** (verified 2026-05-18 by `grep '^create table' schema.sql`):
  - **Tenancy & access**: `applications`, `admin_users`, `invite_codes`, `workspaces`, `workspace_members`.
  - **Catalog & sales**: `products`, `events`, `event_inventory`, `orders`, `order_items`, `payment_records`, `send_later_orders`.
  - **Customer Portal** (Wave 40a): `customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`.
  - **Audit**: `audit_logs`.
- `rls-policies.sql` — full policy set; mutations gated by role + workspace helpers.
- `seed.sql` — demo data.
- `functions/` — **8 Postgres RPCs**:
  - **Sales**: `create_order`, `void_order`, `correct_order`.
  - **Onboarding**: `redeem_invite_code`.
  - **Customer Portal** (Wave 40a): `create_registration_token` (workspace-only), `claim_registration_token` (anon, token-as-credential).
  - **Sample bucket** (Wave 39a): `convert_event_to_sample`, `convert_sample_to_event`.
- `migrations/` — 2 forward-only migration files (`2026-05-07_add_sample_qty.sql`, `2026-05-07_customer_portal.sql`).

None applied to a real DB yet — applying is the Supabase-provisioning unblock recipe in `TASKS.md` § Blockers.

## Tests

`pos-for-sell/tests/lib/`:

- 34 test files, 304 assertions — all pass as of 2026-05-18 (`npm test`, 1.7s).
- Coverage by area:
  - **Pure utilities**: csv, date, invite-code, order-number, phone, slug, sku.
  - **POS logic**: cart calc, split payments, upsell.
  - **Payment**: PromptPay (EMVCo payload + CRC16).
  - **Dashboard**: metrics, date range, source split.
  - **Customer**: customer-portal (data layer), customer-tokens (16-char token logic), customer-notes, returning-customer (phone lookup).
  - **Sample bucket** (Wave 39a): type guards + demo conversion.
  - **Demo stores** (localStorage stand-ins for everything Supabase will own): activity feed, close-day, customer lifecycle, customers, forecast, loyalty, margin, pets, pre-orders, QR claims, refunds, sales, settings, stock-count.

## Documentation

`pos-for-sell/docs/` (25 files; verified 2026-05-18):

**Strategy / vision:**
- `ROADMAP.md` — canonical strategic direction.
- `PROJECT_VISION.md` — pilot target + scope.

**Founder learning curriculum** (2026-05-07+):
- `LEARNING.md` — 5-level curriculum.
- `LEARNING_GLOSSARY.md` — term lookup.
- `LEARNING_REPO_MAP.md` — annotated repo tour.
- `LEARNING_FLOWS.md` — sequence diagrams for main flows.
- `LEARNING_ERRORS.md` — how to read errors.
- `LEARNING_AI_WORKFLOW.md` — how to work with AI agents.
- `LEARNING_TYPESCRIPT.md` — 10-min TS reading cheat sheet.

**Architecture / technical reference:**
- `ARCHITECTURE.md` — technical overview.
- `DATABASE_SCHEMA.md` — table list (companion to `database/schema.sql`).
- `DESIGN_TOKENS.md` — palette + typography from meowmeow.
- `GLOSSARY.md` — project-specific terms (distinct from `LEARNING_GLOSSARY.md`).
- `CODE_STYLE.md` — code conventions.

**Operations / planning:**
- `BATCH_PLAN.md` (DD-01..100), `BATCH_PLAN_VOL2.md` (DD-101..200).
- `USER_FLOW.md` — application → invite → workspace → POS flow.
- `PILOT_RULES.md` — accept/reject criteria for pilot applicants.
- `ENV_VARS.md`, `DEPLOYMENT.md` — environment setup + deploy.
- `SECURITY.md`, `ACCESSIBILITY.md`, `PERFORMANCE.md`, `INCIDENT_RESPONSE.md` — operational concerns.
- `STATUS.md` (this file).

## Blocked work

Everything that requires:

1. **Supabase project** — DD-15 (apply persistence), DD-19 (status check), DD-23..32 (admin operations end-to-end), DD-33..42 (registration + workspace), DD-43..54 (product setup persistence), DD-65..74 (POS sale persistence), DD-75..84 (send-later persistence), DD-85..94 (real dashboard), DD-95..100 (corrections, audits, pilot ops).
2. **Resend** — DD-17, DD-28, DD-30, DD-82, DD-183.
3. **Vercel link** — actual deployment.

Recipe to unblock is in `TASKS.md` § Blockers.

## Vol 2 plan deltas

`docs/BATCH_PLAN_VOL2.md` lists DD-101..200. After Wave 9 + Wave 10 of this run, **roughly DD-101..173 are landed**, with several non-essential ones (i18n DD-175..184, visual fidelity DD-185..189, favicon DD-199, bundle analyzer DD-154) intentionally skipped to avoid pad work. The plan doc captures all 100; pull any of the remaining ones into `TASKS.md` to claim.

Latest waves landed:
- Wave 8 (DD-144, 187, 188, 191..193, 198): PromptPay QR display via qrcode + EMVCo lib, /app/pos/success/[orderId], approve/reject Actions on /admin/applications, useDebouncedValue, useLocalStorageState, Money component.
- Wave 9 (DD-156..159, 169): Playwright config + 3 e2e specs + CONTRIBUTING.md.
- Wave 10 (DD-167, 170, 172, 174): PERFORMANCE.md, INCIDENT_RESPONSE.md, CODE_STYLE.md, GLOSSARY.md.

## Latest waves (post-DD-100, organic numbering)

After DD-100 the project shifted from the original 100-batch plan into organic "Wave NN" feature batches driven by competitor research, the meowmeow Pet Expo field findings, and the strategic correction in [VISION.md](../../VISION.md). Each wave is 1–N batches that ship as a cohesive unit.

Snapshot at the end of 2026-05-07:

- **Wave 12–17** (2026-05-05): demo POS persistence, product CRUD, sale persistence, send-later workflow, customer info, image upload, bill void, POS search, helper extraction + 10 more unit tests.
- **Wave 18**: sample seed + demo audit log + print receipt.
- **Wave 19**: EN/TH bilingual UI — i18n core + translated public pages + POS chrome.
- **Wave 20**: 3 features stolen from competitor research.
- **Wave 21**: quick-cash tender + change + per-line notes.
- **Wave 22**: split payments — cash + PromptPay + card on one bill.
- **Wave 23**: loyalty points (Loyverse / Square pattern).
- **Wave 24**: customer notes + tags (Shopify-inspired).
- **Wave 25**: cash reconciliation at close-of-day.
- **Wave 26**: partial refunds with reason — extends void flow.
- **Wave 27**: QR self-order — customer-facing `/qr-menu` + cashier import.
- **Wave 28**: upsell suggestions per product (Toast / Shopify pattern).
- **Wave 29**: live activity feed on dashboard.
- **Wave 30**: demand forecasting / reorder suggestions (Lightspeed-inspired).
- **Wave 31**: pre-order capture for sold-out products.
- **Wave 32+36**: COGS / margin per product + reorder points.
- **Wave 33**: stock count session — fix warehouse drift.
- **Wave 34**: multi-period dashboard + period-over-period.
- **Wave 35**: pet profiles — booth-seller competitive moat (currently demo localStorage in `useDemoPets`; will be inverted to portal-driven by Waves 40b/c).
- **Wave 37**: order source / channel attribution.
- **Wave 38**: customer lifecycle + LTV view.
- **Wave 39a** *(merged PR #4, `6455917`, 2026-05-06)*: sample bucket data layer — `event_inventory.sample_qty` + `convert_event_to_sample` / `convert_sample_to_event` RPCs + types + 6 vitest type guards. Carries the meowmeow Batch DD field-tested model into the SaaS.
- **Wave 40a** *(merged PR #5, `2c5d908`, 2026-05-07)*: Customer Portal data layer — 5 new tables (`customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`) + 2 RPCs (`create_registration_token` workspace-only, `claim_registration_token` anon-callable with token-as-credential) + RLS + 11 vitest type guards. Implements the "checkout first, profile later" correction from [VISION.md](../../VISION.md).
- **Wave 40b** *(merged PR #6, `56f743d`, 2026-05-07)*: Customer Portal UI in demo mode — receipt success screen issues a 16-char token + QR + share link via `RegistrationLinkBlock`; new `/register/[token]` route validates the token in the demo store and renders a mobile-first bilingual EN/TH form (customer profile + multi-channel contacts + optional pet block); `useDemoCustomerTokens` hook backed by localStorage (mirrors `useDemoPets` / `useDemoClaims` patterns). Real Supabase wiring lands in Wave 40d. 15 new vitest tests for token logic.
- **Wave 39b** *(merged PR #8, `e9cab46`, 2026-05-07)*: sample bucket UI (demo mode) — port of meowmeow Batch DD UI into `/app/inventory/samples`.
- **Wave 40c** *(merged PR #9, `4522862`, 2026-05-07)*: cashier-side repeat-customer lookup (lookup by phone, attach to current sale, "returning customer" badge with pet preview). Validates the moat in action.
- **Mochi design rebrand** *(PR #73, open — branch `pos/mochi-design-foundation`)*: adopted the Mochi POS design system across the whole app — one unified **indigo/lavender** brand (founder decision: indigo everywhere). `globals.css` `:root` tokens remapped to indigo (`--color-accent #2d2960`, lavender highlight `#b8a9f0`, page `#f7f5fb`), Nunito, cool indigo-tinted shadows, radii 16/20/28; ~24 component files recolored (brown/cream hex literals → tokens); `Button` focus-ring + cursor a11y fix; **the full multi-period dashboard (`DashboardLive`) wired into `/app/dashboard`** (PRD F15 "built but not composed" gap). WCAG-AA verified across the palette. Spec lives in the `mochipos-design` skill; rollout backlog in [MOCHI_ROLLOUT.md](MOCHI_ROLLOUT.md). Supersedes CLAUDE.md hard rule #9 (cream/brown).

Test count: **263 vitest tests pass** as of Wave 40b on its branch (was 65 at end of original 100-batch plan; 248 at end of Wave 38).

## Pending waves

- **Wave 39c**: bill-correction Send Later queue rebuild + warehouse-aware allowance check (port of meowmeow Batch EE).
- **Wave 40d**: real Supabase wiring for the Customer Portal — Server Actions calling `create_registration_token` / `claim_registration_token` RPCs; admin-client server-side token validation in `/register/[token]/page.tsx`. Blocks on Supabase project provisioning.

Note: once Wave 40d + 40c land in production-against-real-Supabase, the in-cashier `PetCardsBlock` from Wave 35 becomes redundant and gets refactored out.
