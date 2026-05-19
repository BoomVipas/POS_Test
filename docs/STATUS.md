# Status — pos-for-sell

Rolling snapshot. The "What's live" section below is the original 2026-05-04 baseline (end of the credential-free build sprint); the "Latest waves" section near the bottom tracks newer work appended per wave. Last meaningful update: 2026-05-07 (Wave 40c).

## What's live

- **Build**: 18 routes, `npm run build` clean. Static where appropriate, dynamic for auth-gated layouts.
- **Tests**: 65 unit tests pass on the pure-logic libs (`npm test`).
- **No external creds yet** — every Supabase / Resend touch degrades to mock data with a "Demo mode" badge.

## Routes

| Path | Status | Notes |
|---|---|---|
| `/` | live | marketing landing |
| `/apply` | wired | server action ready; writes to applications when env is present |
| `/apply/success` | live | post-submit screen |
| `/apply/status` | placeholder | DD-19 wires it |
| `/login` | placeholder | DD-39 wires Supabase Auth |
| `/register` | placeholder | DD-33..38 wires invite redemption |
| `/admin` | gated | three failure modes: not-configured, not-authed, not-admin |
| `/admin/applications` | wired | live query + graceful fallback |
| `/admin/invite-codes` | wired + mock | mock fallback when no creds |
| `/admin/workspaces` | wired + mock | same |
| `/admin/audit-log` | wired + mock | same |
| `/admin/pilot-status` | mock-only | DD-100 makes it live |
| `/app` | gated + demo | demo banner when no creds |
| `/app/pos` | demo | mock catalog of 8 products, full cart UX |
| `/app/setup/products` | placeholder | DD-43..54 wires product setup |
| `/app/dashboard` | mock | full visual dashboard with 6 tiles |
| `/app/send-later` | placeholder | DD-75..84 wires fulfilment |

## Libraries

`src/lib/`:

- `cn.ts` — classnames helper
- `csv/` — RFC 4180 builder
- `database.types.ts` — Supabase types (hand-rolled; regen later)
- `date/` — TH timezone + eventDayIndex
- `email/` — Resend wrapper + new-application + invite templates
- `image/compress.ts` — client-side WebP compression
- `invite-code/` — ambiguity-safe code generator
- `money/format.ts`
- `order-number/` — sequence formatter + parser
- `phone/` — Thai phone normalizer
- `pos/` — types + cart store + calc
- `promptpay/` — EMVCo payload + CRC16
- `sku/` — validator + normalizer
- `slug/` — URL slug + candidates
- `supabase/{client,server,admin,middleware}.ts`
- `auth/admin-check.ts` — three-mode admin gate

## Components

`src/components/ui/`: Button, TextInput, NumberInput, Textarea, Select, Checkbox, Radio, Modal, Toast, Pill, States (Skeleton, EmptyState, ErrorState).

## Database

`pos-for-sell/database/`:

- `schema.sql` — 13 tables, helper fns
- `rls-policies.sql` — full set
- `seed.sql` — demo data
- `functions/create_order.sql`
- `functions/void_order.sql`
- `functions/correct_order.sql`
- `functions/redeem_invite_code.sql`

None applied to a real DB yet.

## Tests

`pos-for-sell/tests/lib/`:

- 9 test files, 65 assertions
- Coverage: PromptPay payload+CRC, slug, invite-code, order-number, cart calc, SKU, phone, CSV, date

## Documentation

`pos-for-sell/docs/`:

- `PROJECT_VISION.md`
- `BATCH_PLAN.md` (DD-01..100)
- `BATCH_PLAN_VOL2.md` (DD-101..200, this sprint's plan)
- `USER_FLOW.md`
- `PILOT_RULES.md`
- `DESIGN_TOKENS.md`
- `DATABASE_SCHEMA.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `ACCESSIBILITY.md`
- `ENV_VARS.md`
- `DEPLOYMENT.md`
- `STATUS.md` (this file)

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
- **Wave 39a** *(open PR #4)*: sample bucket data layer — `event_inventory.sample_qty` + `convert_event_to_sample` / `convert_sample_to_event` RPCs + types + 6 vitest type guards. Carries the meowmeow Batch DD field-tested model into the SaaS.
- **Wave 40a** *(open PR #5)*: Customer Portal data layer — 5 new tables (`customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`) + 2 RPCs (`create_registration_token` workspace-only, `claim_registration_token` anon-callable with token-as-credential) + RLS + 11 vitest type guards. Implements the "checkout first, profile later" correction from [VISION.md](../../VISION.md).
- **Wave 40b** *(open PR — TBD)*: Customer Portal UI in demo mode — receipt success screen issues a 16-char token + QR + share link via `RegistrationLinkBlock`; new `/register/[token]` route validates the token in the demo store and renders a mobile-first bilingual EN/TH form (customer profile + multi-channel contacts + optional pet block); `useDemoCustomerTokens` hook backed by localStorage (mirrors `useDemoPets` / `useDemoClaims` patterns). When Wave 40a merges + Supabase wires up, the demo store swaps to the `claim_registration_token` RPC without UI changes. 15 new vitest tests for token logic.

Test count: **263 vitest tests pass** as of Wave 40b on its branch (was 65 at end of original 100-batch plan; 248 at end of Wave 38).

## Pending waves

- **Wave 39b**: sample bucket UI — Make / Return buttons in Stock Setup, Server Actions wrapping the two RPCs, integration test against a live Supabase dev DB.
- **Wave 39c**: bill-correction Send Later queue rebuild + warehouse-aware allowance check (port of meowmeow Batch EE).
- **Wave 40c**: cashier-side repeat-customer lookup (lookup by phone, attach to current sale, surface "returning customer" badge with pet preview). Once 40b + 40c land in production, the in-cashier `PetCardsBlock` from Wave 35 becomes redundant and gets refactored out.
- **Wave 40d**: real Supabase wiring for the Customer Portal — Server Actions calling `create_registration_token` / `claim_registration_token` RPCs; admin-client server-side token validation in `/register/[token]/page.tsx`. Blocks on Wave 40a merge + Supabase project provisioning.
