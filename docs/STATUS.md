# Status — pos-for-sell

Snapshot at the end of the credential-free build sprint (2026-05-04).

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
