# Repo Map — where everything lives in MochiPOS

> Annotated tour of `pos-for-sell/`. Use this when you're lost. Companion to [LEARNING.md](LEARNING.md) + [LEARNING_GLOSSARY.md](LEARNING_GLOSSARY.md).
> The point isn't to memorize. It's so when an AI agent says "edit `src/app/app/pos/CartPanel.tsx`," you can immediately think *"OK, that's a client component used in the POS page."*

---

## Top-level layout

```
pos-for-sell/
├── docs/                     ← all documentation lives here
├── database/                 ← SQL: schema, RLS, RPCs, migrations, seed
├── src/                      ← application code (TS/TSX)
├── tests/                    ← vitest unit tests (tests/lib/) + Playwright e2e (tests/e2e/)
├── public/                   ← static files served as-is (favicon, images)
├── .env.example              ← template for env vars (real secrets in .env.local)
├── package.json              ← dependencies + scripts (npm run dev, etc.)
├── tsconfig.json             ← TypeScript config
├── eslint.config.mjs         ← linter rules
├── next.config.ts            ← Next.js config
├── postcss.config.mjs        ← CSS pipeline (Tailwind)
├── playwright.config.ts      ← end-to-end test config
├── vitest.config.ts          ← unit test config
├── README.md                 ← repo intro
├── CLAUDE.md                 ← AI agent execution protocol (project-scoped)
├── CONTRIBUTING.md           ← batch naming + flow
└── TASKS.md                  ← live status board
```

---

## `docs/` — documentation

| File | What it is | When to read |
|---|---|---|
| **ROADMAP.md** | Founder's strategic direction (canonical) | When you want to know *where MochiPOS is going* |
| PROJECT_VISION.md | Pilot target + scope | When deciding if a feature is in scope |
| LEARNING.md | The 5-level curriculum | While learning |
| LEARNING_GLOSSARY.md | Term lookup | When a word is unfamiliar |
| LEARNING_REPO_MAP.md | This file | When lost in folders |
| LEARNING_FLOWS.md | Sequence diagrams for the main user journeys (apply, sale, portal claim, returning-customer, admin) | After Level 3 |
| LEARNING_ERRORS.md | What error messages mean and how to read them | When something breaks |
| LEARNING_AI_WORKFLOW.md | How to brief, review, and verify AI-generated work on this stack | When working with AI agents |
| LEARNING_TYPESCRIPT.md | 10-minute cheat sheet for reading TypeScript without learning to write it | When you hit unfamiliar `: string \| null` syntax |
| ARCHITECTURE.md | Technical architecture overview | When designing new features |
| BATCH_PLAN.md | Original 100-batch plan | For historical context |
| BATCH_PLAN_VOL2.md | Continuation past DD-100 | For Wave-numbered work |
| DATABASE_SCHEMA.md | Tables overview | When working with DB |
| USER_FLOW.md | End-to-end user journeys | When designing seller / customer flows |
| DESIGN_TOKENS.md | Color palette, spacing, typography | When styling |
| ENV_VARS.md | All env vars and what they do | When deploying or troubleshooting |
| DEPLOYMENT.md | Vercel + Supabase setup | When deploying first time |
| PILOT_RULES.md | Pilot operational rules | Before pilot launch |
| SECURITY.md | Security posture | When reviewing risky code |
| ACCESSIBILITY.md | a11y notes | When adjusting UI |
| INCIDENT_RESPONSE.md | What to do when something breaks | When something breaks |
| PERFORMANCE.md | Performance notes | When the app feels slow |
| CODE_STYLE.md | Code conventions | Reference |
| GLOSSARY.md | Project-specific terms (different from LEARNING_GLOSSARY) | Quick reference |
| STATUS.md | Test count + route count snapshot | After major waves |

---

## `database/` — SQL files

The database is the most important folder for **trust**. Every table here is a place data lives forever.

```
database/
├── schema.sql                                    ← all tables, all columns, all types
├── rls-policies.sql                              ← Row Level Security — who can see/edit what
├── seed.sql                                      ← demo data for dev environments
├── functions/                                    ← Postgres functions (RPCs)
│   ├── create_order.sql                          ← THE atomic sale write
│   ├── void_order.sql                            ← inverse of create_order
│   ├── correct_order.sql                         ← edit an existing order
│   ├── redeem_invite_code.sql                    ← invite code → workspace creation
│   ├── create_registration_token.sql             ← Wave 40a: cashier issues token
│   ├── claim_registration_token.sql              ← Wave 40a: customer claims token (anon!)
│   ├── convert_event_to_sample.sql               ← Wave 39a: move stock booth→sample
│   └── convert_sample_to_event.sql               ← Wave 39a: move stock sample→booth
└── migrations/
    ├── README.md                                 ← migration discipline
    ├── 2026-05-07_add_sample_qty.sql             ← Wave 39a migration
    └── 2026-05-07_customer_portal.sql            ← Wave 40a migration
```

**Reading order:**
1. `schema.sql` — top to bottom, just to see the table list (15+ tables).
2. `rls-policies.sql` — pick one table (e.g. `products`) and read its policies.
3. `functions/create_order.sql` — read the comment block at the top and the first 50 lines.

**Key insight:** every business table has `workspace_id`. Every RLS policy filters by `workspace_id`. Every RPC checks `is_workspace_member(workspace_id, ...)`. Three layers of tenant defense.

---

## `src/` — application code

```
src/
├── app/                      ← Next.js routes (URL = folder path)
├── lib/                      ← shared modules — utilities, types, demo stores, Supabase clients
├── components/               ← shared UI components (toast, language switcher, etc.)
├── proxy.ts                  ← Next.js middleware (replaced "middleware.ts" per Next 16)
└── (other config files)
```

### `src/app/` — every URL in MochiPOS

The folder structure under `src/app/` *is* the URL structure of the site.

```
src/app/
├── layout.tsx                            ← wraps EVERY page (root <html>, <body>, providers)
├── page.tsx                              ← /  (the marketing landing)
├── error.tsx                             ← shown if any route throws
├── not-found.tsx                         ← shown for unknown URLs
├── loading.tsx                           ← shown while a server component loads
├── globals.css                           ← Tailwind + theme
│
├── apply/                                ← public application form
│   ├── page.tsx                          ← /apply
│   ├── Form.tsx                          ← (client component)
│   ├── actions.ts                        ← (server action: submitApplication)
│   ├── schema.ts                         ← (Zod schema)
│   ├── success/page.tsx                  ← /apply/success
│   └── status/page.tsx                   ← /apply/status
│
├── login/                                ← /login
├── register/                              ← invite code redemption + customer portal
│   ├── page.tsx                          ← /register (invite code entry)
│   └── [token]/                          ← DYNAMIC: /register/<any-token>
│       ├── page.tsx                      ← (server component — validates token)
│       ├── RegisterClient.tsx            ← (client component — the form)
│       └── schema.ts                     ← (Zod schema)
│
├── admin/                                ← platform admin pages (gated by admin-check)
│   ├── layout.tsx                        ← admin auth gate
│   ├── page.tsx                          ← /admin
│   ├── applications/                     ← /admin/applications (review form submissions)
│   ├── invite-codes/                     ← /admin/invite-codes
│   ├── workspaces/                       ← /admin/workspaces
│   ├── audit-log/                        ← /admin/audit-log
│   └── pilot-status/                     ← /admin/pilot-status
│
├── app/                                  ← seller-facing app (auth + workspace gated)
│   ├── layout.tsx                        ← auth gate + nav header + demo banner
│   ├── page.tsx                          ← /app (seller home with tiles)
│   ├── pos/                              ← /app/pos (the cashier screen)
│   │   ├── page.tsx
│   │   ├── POSWorkspace.tsx              ← (orchestrates the whole POS layout)
│   │   ├── CartPanel.tsx                 ← (right side cart)
│   │   ├── ProductGrid.tsx               ← (product cards)
│   │   ├── PaymentPicker.tsx
│   │   ├── ReviewModal.tsx
│   │   ├── ReturningCustomerLookup.tsx   ← Wave 40c
│   │   ├── PetCardsBlock.tsx             ← Wave 35
│   │   └── success/[orderId]/            ← /app/pos/success/<order-id>
│   │       ├── page.tsx
│   │       ├── SuccessClient.tsx
│   │       └── RegistrationLinkBlock.tsx ← Wave 40b QR code
│   ├── setup/products/                   ← /app/setup/products (CRUD)
│   ├── dashboard/                        ← /app/dashboard
│   ├── send-later/                       ← /app/send-later
│   ├── correction/                       ← /app/correction
│   ├── audit-log/                        ← /app/audit-log
│   ├── close-day/                        ← /app/close-day
│   ├── customers/                        ← /app/customers
│   ├── pre-orders/                       ← /app/pre-orders
│   ├── inventory/samples/                ← /app/inventory/samples (Wave 39b)
│   ├── stock-count/                      ← /app/stock-count (Wave 33)
│   └── settings/                         ← /app/settings
│
├── qr-menu/                              ← /qr-menu (customer-facing menu via QR)
│   ├── page.tsx
│   └── CustomerView.tsx
│
└── learn/                                ← /learn (founder learning landing — visual TOC for LEARNING.md)
    └── page.tsx
```

**Patterns to recognize:**
- `page.tsx` → a real URL.
- `layout.tsx` → wrapper for everything in that folder.
- `[token]` (square brackets) → dynamic URL segment.
- Other `.tsx` files (`Form.tsx`, `CartPanel.tsx`, etc.) → just regular components, NOT URLs.
- `actions.ts` → server actions used by nearby components.
- `schema.ts` → Zod form validation.

### `src/lib/` — shared modules

```
src/lib/
├── supabase/                 ← Supabase clients (one per context)
│   ├── client.ts             ← browser-side client (for client components)
│   ├── server.ts             ← server-side client (for server components / actions)
│   ├── admin.ts              ← service-role client (NEVER touch from client)
│   └── middleware.ts         ← used by src/proxy.ts
├── email/                    ← Resend email helpers
│   ├── resend.ts             ← sendEmail(), adminEmail()
│   └── templates/            ← HTML email templates
├── auth/admin-check.ts       ← shared admin gate
├── i18n/                     ← TH/EN translations
│   ├── dictionaries.ts       ← the actual strings
│   ├── server.ts             ← getDict() for server components
│   ├── provider.tsx          ← LangProvider for client components
│   └── actions.ts            ← server action: setLang
├── pos/                      ← POS-specific logic (cart store, calc, types)
│   ├── cart-store.tsx        ← React context + reducer for the cart
│   ├── calc.ts               ← totals math
│   └── types.ts              ← PaymentMethod, FulfillmentType, etc.
├── money/format.ts           ← formatTHB, satang ↔ baht
├── promptpay/                ← PromptPay QR generation
├── slug/                     ← URL-safe slug from text
├── invite-code/              ← invite code validation
├── order-number/             ← event_001 / event_002 formatting
├── sku/                      ← SKU validation
├── phone/                    ← phone normalization (TH-aware)
├── csv/                      ← CSV export
├── date/                     ← date helpers
├── image/compress.ts         ← client-side image compression for product photos
├── hooks/                    ← shared React hooks
│   ├── useDebouncedValue.ts
│   └── useLocalStorageState.ts
├── demo/                     ← localStorage stand-ins for everything (Supabase-free dev)
│   └── (one file per concept: catalog, sales, customers, pets, etc.)
├── database.types.ts         ← TypeScript types matching the DB schema
└── cn.ts                     ← classnames helper
```

**Key insight:** Three Supabase clients, one per role:
- `client.ts` → browser-side. Limited by RLS.
- `server.ts` → server-side, uses the user's session cookie. Limited by RLS.
- `admin.ts` → service role. **No RLS!** Use only for admin/system tasks. Never imported by anything that renders on the client.

### `src/components/` — shared UI

```
src/components/
├── ui/                       ← Toast, Button, Modal, etc.
└── LanguageSwitcher.tsx      ← TH/EN toggle
```

### `src/proxy.ts` — middleware

Runs on every request before the page renders. In MochiPOS it handles Supabase session refresh.

---

## `tests/` — automated tests

```
tests/
├── lib/                      ← vitest unit tests for shared modules (~34 files, 304 tests)
│   ├── slug.test.ts
│   ├── pos-calc.test.ts
│   ├── customer-portal.test.ts
│   ├── customer-tokens.test.ts
│   ├── returning-customer.test.ts
│   ├── sample-bucket.test.ts
│   ├── sample-bucket-demo.test.ts
│   └── (~30 more)
└── e2e/                      ← Playwright smoke specs (3 files)
    ├── landing.spec.ts       ← / renders hero + Apply CTA
    ├── apply.spec.ts         ← /apply renders required fields + blocks empty submit
    └── pos.spec.ts           ← /app/pos product grid + add-to-cart + payment picker
```

**Run unit tests:** `npm test` (one-shot) or `npm run test:watch` (auto-rerun on save).

**Run e2e:** `npm run e2e` (Playwright auto-starts the dev server on :3000 if not running). First-time setup: `npm run e2e:install` to download chromium.

The unit tests check pure logic — no Supabase, no browser. They run in 1-2 seconds and catch bugs in the modules under `src/lib/`. **Always run them after a change.**

The e2e tests run real browser sessions against the dev server (in demo mode, no Supabase needed). They're slower; run them when changing UI in the routes they cover.

---

## Where to start reading (recommended order)

If you want to *just understand the project* in 60 minutes:

1. `README.md` — 5 min
2. `docs/ROADMAP.md` § 1-6 — 10 min
3. `database/schema.sql` (skim, just see the table list) — 5 min
4. `src/app/page.tsx` (the landing page) — 5 min
5. `src/app/apply/{page,Form,actions,schema}.tsx` (a complete form flow) — 15 min
6. `src/app/app/layout.tsx` (the auth gate) — 10 min
7. `database/functions/create_order.sql` (the atomic sale write) — 10 min

That's the spine of the project. Everything else is variations on these patterns.
