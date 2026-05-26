# Status — pos-for-sell

Rolling snapshot. The "What's live" section below is the original 2026-05-04 baseline (end of the credential-free build sprint); the "Latest waves" section near the bottom tracks newer work appended per wave.

**Repo provenance:** on 2026-05-25 this project was extracted into a **standalone repo** (`visanchan/mochipos`) via a history-preserving `git subtree split` from the `meowmeow_sandbox` monorepo, where it had lived as the `pos-for-sell/` folder beside the single-file MeowMeow Event POS. The 158-commit history (DD-01 → Wave 42) is preserved; the MeowMeow booth app stayed behind in `meowmeow_sandbox`. Last meaningful code update before the split: 2026-05-24 (Wave 42 auth-error guard); design baseline 2026-05-21 (Mochi indigo rebrand, PR #73). **Migration complete (2026-05-25):** Supabase wired (18 tables / 10 RPCs / RLS / Email auth), deployed to Vercel (`mochipos.vercel.app`, configured against Supabase), CI added, and the original `pos-for-sell/` folder removed from `meowmeow_sandbox` (`59e80af`).

## What's live

- **Build**: 31 routes (`page.tsx` files in `src/app/`; +`/onboarding` +`/app/events` since the last count). Static where appropriate, dynamic for auth-gated layouts.
- **Tests**: 347 unit tests across 37 files all pass — re-verified 2026-05-22 (`npm test`, 2.6s). Pure-logic libs only; no Supabase, no browser.
- **No external creds yet** — every Supabase / Resend touch degrades to mock data with a "Demo mode" badge.

## Routes

31 routes total (verified 2026-05-22 by `find src/app -name page.tsx | wc -l`). Status legend: **live** = real page; **wired** = real impl with optional Supabase; **demo** = full UI on localStorage; **mock** = real UI on mock data; **placeholder** = stub page saying "not yet built"; **gated** = checks for auth/config.

| Path | Status | Notes |
|---|---|---|
| **Public** | | |
| `/` | live | marketing landing |
| `/apply` | wired | form + server action; writes to `applications` when env present |
| `/apply/success` | live | post-submit screen |
| `/apply/status` | live | i18n status copy; real DB lookup deferred to a future wave |
| **Seller onboarding** | | |
| `/login` | **wired** | email + password sign-in via Supabase Auth; safe `?next=` redirect (DD-39) |
| `/register` | **wired** | invite-code redemption → account + workspace via `redeem_invite_code` (DD-33–38) |
| `/login/forgot` | **wired** | request a Supabase password-reset email; de-oracled (DD-40) |
| `/login/reset` | **wired** | set a new password inside the recovery session (DD-40) |
| `/auth/confirm` | **wired** | route handler — exchanges the recovery code/token for a session (DD-40) |
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
| `/app/pos` | wired + demo | sells from the active event's real catalog/inventory; "Confirm" → `create_order` RPC (DD-55–66) when configured; demo/mock otherwise |
| `/app/pos/success/[orderId]` | demo | success screen + PromptPay QR + Customer Portal token (Wave 8 + 40b) |
| `/app/dashboard` | demo | multi-period dashboard, 10+ tiles (Wave 29/34) |
| `/app/events` | wired + demo | real `events` + `event_inventory` (create, allocate active products, start/close) when configured (Wave 43); demo wizard fallback |
| `/app/customers` | demo | auto-derived from past sales with lifecycle stage (Wave 38) |
| `/app/correction` | wired + demo | real `void_order` RPC (restore stock + cancel send-later + audit) when configured (DD-96); demo void/refund localStorage fallback. Partial-refund RPC → later batch |
| `/app/audit-log` | demo | activity history (Wave 18) |
| `/app/close-day` | wired + demo | live cash reconciliation over today's real `orders`/`payment_records` (expected vs counted vs discrepancy) when configured (Wave 44); demo localStorage fallback. Persisting the close record → DD-92 |
| `/app/send-later` | wired + demo | real `send_later_orders` queue + status flow (pending→packed→shipped→completed / cancel) when configured (DD-75–81); demo localStorage fallback |
| `/app/stock-count` | demo | walk-the-warehouse recount with variance (Wave 33) |
| `/app/pre-orders` | demo | sold-out pre-orders (Wave 31) |
| `/app/inventory/samples` | wired + demo | real `event_inventory` sample bucket on the active event via `convert_event_to_sample`/`convert_sample_to_event` RPCs (Wave 39d); demo localStorage fallback |
| `/app/settings` | demo | workspace settings |
| `/app/setup/products` | wired + demo | real `products` CRUD when configured (DD-43–53); demo localStorage fallback. Image→Storage deferred (DD-45) |
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

- 37 test files, 347 assertions — all pass as of 2026-05-22 (`npm test`, 2.6s).
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

After DD-100 the project shifted from the original 100-batch plan into organic "Wave NN" feature batches driven by competitor research, the meowmeow Pet Expo field findings, and the strategic correction in [ROADMAP.md](ROADMAP.md). Each wave is 1–N batches that ship as a cohesive unit.

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
- **Wave 40a** *(merged PR #5, `2c5d908`, 2026-05-07)*: Customer Portal data layer — 5 new tables (`customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`) + 2 RPCs (`create_registration_token` workspace-only, `claim_registration_token` anon-callable with token-as-credential) + RLS + 11 vitest type guards. Implements the "checkout first, profile later" correction from [ROADMAP.md](ROADMAP.md).
- **Wave 40b** *(merged PR #6, `56f743d`, 2026-05-07)*: Customer Portal UI in demo mode — receipt success screen issues a 16-char token + QR + share link via `RegistrationLinkBlock`; new `/register/[token]` route validates the token in the demo store and renders a mobile-first bilingual EN/TH form (customer profile + multi-channel contacts + optional pet block); `useDemoCustomerTokens` hook backed by localStorage (mirrors `useDemoPets` / `useDemoClaims` patterns). Real Supabase wiring lands in Wave 40d. 15 new vitest tests for token logic.
- **Wave 39b** *(merged PR #8, `e9cab46`, 2026-05-07)*: sample bucket UI (demo mode) — port of meowmeow Batch DD UI into `/app/inventory/samples`.
- **Wave 40c** *(merged PR #9, `4522862`, 2026-05-07)*: cashier-side repeat-customer lookup (lookup by phone, attach to current sale, "returning customer" badge with pet preview). Validates the moat in action.
- **Mochi design rebrand** *(PR #73, open — branch `pos/mochi-design-foundation`)*: adopted the Mochi POS design system across the whole app — one unified **indigo/lavender** brand (founder decision: indigo everywhere). `globals.css` `:root` tokens remapped to indigo (`--color-accent #2d2960`, lavender highlight `#b8a9f0`, page `#f7f5fb`), Nunito, cool indigo-tinted shadows, radii 16/20/28; ~24 component files recolored (brown/cream hex literals → tokens); `Button` focus-ring + cursor a11y fix; **the full multi-period dashboard (`DashboardLive`) wired into `/app/dashboard`** (PRD F15 "built but not composed" gap). WCAG-AA verified across the palette. Spec lives in the `mochipos-design` skill; rollout backlog in [MOCHI_ROLLOUT.md](MOCHI_ROLLOUT.md). Supersedes CLAUDE.md hard rule #9 (cream/brown).

- **Wave 41 — Pre-Supabase hardening sweep** *(2026-05-24, PRs #94–#102)*: a `/debug-mantra` audit of the full tree produced findings L1–L6 (live) and D1–D6 (latent on the Supabase RPCs). Eleven sub-batches shipped before the DD-65 wire-up, each landing a failing test before its fix. **Live (L):** discount cap on the cart (L1, #94); mock admin Approve/Reject honesty (L3, #96); `validateSplits` rejects negatives (L6, #95); `proxy.ts` wiring verified (L4, #93); `/apply` rate limit + duplicate-email de-oracle (L2, #97). **Latent (D), all on `create_order` / token RPCs:** mixed-payment requires + validates `payments[]` (D1/D2, #98); discount capped server-side (D3, #99); dead `payment_status` CASE removed (D4, #100); `claim_registration_token` de-oracled + token generator floor (D5/D6, #101). **Test infra:** introduced a **pglite** (Postgres-in-WASM, no Docker) DB-function test layer under `tests/db/` — chosen over the planned sql-mock so plpgsql executes for real; 41k closed it out with a harness doc + coverage guard (#102). ADR: [`adr/2026-05-24-wave-41-hardening.md`](adr/2026-05-24-wave-41-hardening.md). **41e (orphan-user, L5) resolved** (#104, founder delegated): authenticated-but-workspace-less users redirect to `/onboarding`; demo mode reserved for the unconfigured pilot path. All 12 sub-batches shipped. **Codex post-hoc review (2026-05-24) approved both** the pglite-over-sql-mock infra choice and the 41e auth-gating change; the one Medium follow-up it raised (a Supabase query error masquerading as onboarding-incomplete) is fixed in **Wave 42** (below).

Test count: **407 vitest tests** across 45 files as of Wave 42 on `main` (`npm test`; was 403 at Wave 41, 263 at Wave 40b, 65 at end of the original 100-batch plan). 23 of those are the `tests/db/` pglite layer (`npm run test:db`). Note: 2 build-output integration tests in `proxy.test.ts` (Wave 41d) skip unless a `next build` ran first, so a cold `npm test` reports `405 passed, 2 skipped` — benign.

- **Wave 42 — Auth-error guard** *(2026-05-24, branch `pos/wave-42-auth-error-guard`)*: the one Medium follow-up from the Wave 41 Codex post-hoc review. The `/app` layout discarded the Supabase `error` from the `workspace_members` / `workspaces` lookups (it destructured only `{ data }`), so a transient query failure (network / RLS / schema blip) read as `hasMember=false` and would redirect a fully-provisioned seller to `/onboarding` as if they were an orphan. `resolveAppGuard` now takes a `queryError` input and returns a distinct `{ kind: "error" }` (precedence: demo → auth → query-error → membership → admit); the layout captures the `error` and renders a bilingual, retryable `ErrorState` ("try again") instead of guessing orphan-hood. **Latent until DD-65 wires Supabase** — fixed now while the decision core is fresh. +4 unit cases (`tests/lib/app-guard.test.ts`, 9 total); suite 403 → **407**. Merged to `main` 2026-05-24 (`ea6d512`, PR #105); Codex review: ship.

## Post-Supabase wire-up arc (DD-39 → DD-65) — in progress (2026-05-25)

Now that Supabase + Vercel are live, the original DD-XX Phase 3/5 batch numbers are being wired to the real backend, one batch per autonomous-loop tick (cron, ~10 min). Reaches a real atomic sale at DD-65 (`create_order`) + DD-66 (inventory atomicity). Shipped so far:

- **DD-39** (`3df4bb1`, PR #1) — `/login` → Supabase Auth. `signIn` action (`signInWithPassword` → generic error, no enumeration oracle → `redirect(safeNextPath(next))`); new `lib/auth/safe-next.ts` open-redirect guard (+8 tests); bilingual form.
- **DD-41** (`4832d1c`, PR #2) — session lifecycle. Verified the per-request cookie refresh (`proxy.ts` → `updateSession`); added **sign-out** (action + header button, configured mode only).
- **DD-42** (`ab89614`, PR #4) — RLS tenant-isolation test. Extended the pglite harness with `bootRlsDb` (loads `rls-policies.sql`, creates the `authenticated` role + grants) + `actAs`/`actAsSuperuser`; `tests/db/rls-isolation.test.ts` proves user A can't SELECT user B's products/workspace/inventory, with a disable/re-enable control encoding "red without policies, green with them". Suite 415 → 422.
- **DD-33–38** (`11edcfc`, PR #5) — invite-redeem register flow. `/register`: enter code → `validateInviteCode` (service-role lookup, de-oracled single failure message) → brand/email + chosen workspace slug → `completeRegistration` (admin `createUser` auto-confirmed → sign in → `redeem_invite_code` RPC creates workspace + owner membership) → `/app`. New pure `lib/auth/invite-status.ts` (mirrors the RPC gate) + `lib/slug isValidSlug` (mirrors the RPC slug regex). First pglite test of `redeem_invite_code` (8 cases) — pinned a latent quirk: its `set status='expired'` write is rolled back by the subsequent `raise` (functional gate still correct; cosmetic dead code, flagged for cleanup). Suite 422 → 443.
- **DD-40** (`8443533`, PR #6) — password reset. `/login` "Forgot password?" → `/login/forgot` (`resetPasswordForEmail`, de-oracled "sent if it exists") → recovery email link → `/auth/confirm` route exchanges the PKCE `code` (or `token_hash`) for a session, then forwards to `/login/reset` (sanitised `next` via `safeNextPath`) → `updateUser` sets the new password → `/app`. `passwordReset` i18n block (EN+TH). Suite 443 → 449.
- **DD-43–53** (`f6bf29b`, PR #7) — product persistence. `/app/setup/products` now reads/writes the real `products` table when configured (demo localStorage stays for the unconfigured pilot build). New `lib/products/parse.ts` (pure validate/normalise → satang ints, +8 tests), `lib/auth/workspace.ts` (`getActiveWorkspace` + `canWriteCatalog`), Server Actions `createProduct`/`updateProduct`/`setProductActive` (workspace-scoped, RLS-enforced, SKU immutable on edit, soft-delete via `is_active`), a lean `ProductFormLive` + `CatalogManagerLive` (real-schema fields only). pglite test pins `(workspace_id, sku)` uniqueness (+3). Suite 449 → 460. **Deferred:** DD-45/46 image→Storage, DD-49 CSV, DD-50 categories, DD-54 setup-gate.
- **Wave 43** (`70d8e15`, PR #8) — events + `event_inventory` foundation (organic infra the DD plan assumed). `/app/events` (configured): create an event (status `planned`), **allocate active products** into `event_inventory` at their `default_starting_qty` (idempotent upsert), and start/close it. `lib/events/parse.ts` (+9 tests), `canManageEvents`, Server Actions `createEvent`/`allocateActiveProducts`/`setEventStatus`, `EventsManagerLive`; demo `EventSetupClient` stays unconfigured. Gives `create_order` a running event + lockable stock. Suite 460 → 469.
- **DD-55–66** (this PR) — **the real POS sale.** `/app/pos` (configured) loads the active event (latest planned/running) + its allocated active products (with `current_qty` from `event_inventory`) and sells from real data (DD-55–64). "Confirm sale" calls the **`create_order`** RPC via the `submitOrder` Server Action (DD-65): the cashier sends only intent (lines/payment/customer/splits), `workspace_id` is resolved server-side, and the RPC owns prices/stock/totals and decrements inventory atomically (`FOR UPDATE` + insufficient-stock guard = DD-66). Pure `buildCreateOrderPayload` (+4 tests) + an end-to-end pglite test (builder → `create_order` → asserts order/inventory decrement/oversell rejection, +3). `POSMode` context routes demo vs. live confirm; demo path untouched. Suite 469 → 476. **Deferred:** live free-sample toggle (DD-74) + the full real receipt page (DD-67 — the success page degrades gracefully to "Sale recorded" + id today).

## ✅ Post-Supabase wire-up arc COMPLETE (2026-05-25)

**DD-39 login → DD-65 `create_order` is done.** A pilot seller can: redeem an invite → create a workspace → build a real catalog → open an event + allocate stock → ring up a sale that writes `orders`/`order_items`/`payment_records`/`audit_logs` and decrements `event_inventory` atomically — all on live Supabase, RLS-isolated per tenant. Login, sign-out, and password reset round out auth. 9 feature PRs (#1–#8 + the real-sale PR) + 1 chore; suite 407 → 476.

**Next arc (post-sale polish, not yet scheduled):** DD-67 real receipt page · DD-45/46 product images → Storage · DD-49 CSV import · DD-54 setup-complete gate · DD-74 live samples · DD-85+ real dashboard · the `redeem_invite_code` dead-code cleanup noted in DD-33–38.

## Pending waves

- **Wave 39c**: bill-correction Send Later queue rebuild + warehouse-aware allowance check (port of meowmeow Batch EE).
- **Wave 40d**: real Supabase wiring for the Customer Portal — Server Actions calling `create_registration_token` / `claim_registration_token` RPCs; admin-client server-side token validation in `/register/[token]/page.tsx`. Blocks on Supabase project provisioning.

Note: once Wave 40d + 40c land in production-against-real-Supabase, the in-cashier `PetCardsBlock` from Wave 35 becomes redundant and gets refactored out.
