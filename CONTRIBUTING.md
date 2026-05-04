# Contributing to pos-for-sell

## Setup

```bash
cd pos-for-sell
npm install
cp .env.example .env.local      # fill in Supabase + Resend later
npm run dev                     # http://localhost:3000
```

## Daily commands

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server with Turbopack |
| `npm run build` | Production build (also runs lint + type-check) |
| `npm run lint` | ESLint (Next config) |
| `npm test` | Vitest unit tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run e2e` | Playwright tests against `npm run dev` |
| `npm run e2e:install` | One-time: download chromium browser binary |

## Branch + commit conventions

- Branch off `main`: `pos/DD-XXX-short-slug`.
- Commit messages: `[DD-XXX] one-line subject`, then a body explaining the why and any migration / env / risk notes.
- Co-author Claude when AI did the bulk of the work (see existing commits).

## Where things live

```
pos-for-sell/
├── docs/              long-form: vision, plans, architecture, security, etc.
├── database/          schema.sql + rls-policies.sql + seed.sql + functions/*
├── public/            static assets (favicons, OG images)
├── src/
│   ├── app/           Next.js App Router pages + layouts + actions
│   ├── components/    UI components (ui/* primitives, then domain components)
│   ├── lib/           pure logic + Supabase + Resend + helpers + hooks
│   └── proxy.ts       Next 16 middleware (was middleware.ts)
└── tests/
    ├── lib/           vitest unit tests for src/lib
    └── e2e/           Playwright specs
```

## Code style

- TypeScript strict (already enabled in tsconfig).
- Server components by default; `"use client"` only when interactivity needs it.
- Money is `bigint` THB satang; render with `formatTHB` or `<Money satang={...} />`.
- Multi-tenant: every business query filters on `workspace_id`. Never use `service_role` for tenant data.
- Forms: `react-hook-form` + `zod` resolver. Server action receives the parsed values.
- Toast over alert: `useToast().push({ kind, message })`.
- No emoji in code unless the user asks. Light, terse comments only when the **why** isn't obvious.
- Avoid `any`. Prefer narrow union types.

## Pull request checklist

- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] `npm run e2e` passes (or document why it can't run yet).
- [ ] No env vars hard-coded; new vars added to `docs/ENV_VARS.md` + `.env.example`.
- [ ] Schema/RLS changes ship with migration ledger entry in `docs/DEPLOYMENT.md`.
- [ ] User-visible behaviour described in PR body, not just commit subject.

## Style guard rails

- Do not introduce a new design token without updating `docs/DESIGN_TOKENS.md`.
- Do not store business data in localStorage. Use Supabase. (`useLocalStorageState` is for ephemeral UI only.)
- Do not import `@/lib/supabase/admin` from anything in `src/app/...` that could render on the client.
- Do not edit `meowmeow_pos_event.html` from a `DD-XXX` batch — it belongs to the other project.

## Picking a batch

See `pos-for-sell/TASKS.md` for live status and `docs/BATCH_PLAN.md` (Vol 1) and `docs/BATCH_PLAN_VOL2.md` (Vol 2) for the full backlog. Pick a `ready-for-claude` entry, claim it in `TASKS.md`, and go.
