# Code Style

Small, opinionated set on top of `eslint-config-next` and `tsconfig` strict mode.

## TypeScript

- Strict mode (already in `tsconfig.json`). No `any`. If a third-party type is missing, write a narrow type or `as unknown as Foo` with a comment explaining why.
- Prefer **discriminated unions** over `boolean` flags for state machines (`type Status = "loading" | "ok" | "error"` over `loading: bool, error: string | null`).
- Prefer **named exports** for components and utilities. Default exports only for Next.js page/layout files (required by the framework).
- Prefer `Readonly<>` and `as const` for true immutables.
- File extensions: `.ts` for code, `.tsx` for files containing JSX, `.test.ts` / `.spec.ts` for tests.

## React

- Server components by default. `"use client"` only when interactivity, lifecycle, or browser APIs are needed.
- One component per file unless they're small siblings of the same purpose.
- Hooks live in `src/lib/hooks/`. They are client-only (`"use client"`).
- Forms: `react-hook-form` + `@hookform/resolvers/zod`.

## Styling

- Tailwind classes inline. Avoid `@apply` (encourages stacking complexity).
- Color tokens via the `@theme inline` block in `globals.css`. Use `bg-panel`, `text-accent-strong`, `border-line`, etc.
- Radii via CSS vars: `rounded-[var(--radius-md)]` etc.
- Tabular numerics on prices/totals: add `num` class.
- Mobile-first responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`).
- No dark mode (booth lighting is unreliable).

## Money

- Always `bigint` satang at the schema layer; `number` (which is safe for Thai-realistic totals) at the React layer.
- Format with `formatTHB` or `<Money satang={...} />`. Never write your own.

## Auth + tenancy

- Multi-tenant isolation goes through RLS, not application code. Never write `where workspace_id = currentUser.workspace` in JS — let Supabase enforce it via the user's session.
- The service role client lives only at `src/lib/supabase/admin.ts` and only loads server-side. Don't import it from client components.

## Errors

- User-facing errors: friendly + actionable. No raw stack traces in the UI.
- Server errors: `console.error` and a generic message back. Sentry will catch the rest later (DD-98).

## Tests

- Unit: vitest, in `tests/lib/`. Test pure logic, especially money math, validation, formatting.
- E2E: Playwright, in `tests/e2e/`. Test happy paths through critical routes.
- Don't write tests just to hit coverage; write them where bugs would cost money.

## Imports

- Path alias `@/...` for `src/...`. No relative climbs (`../../..`).
- Sort imports: external → internal `@/*` → relative `./` → `../`.
- Side-effect imports last: `import "server-only"`, `import "./globals.css"`.

## Comments

- Default to none. Names should explain.
- Add a comment when the *why* is non-obvious — a constraint, a business rule, a workaround.
- No comments that just restate the code.

## Files & layouts

- New tenant pages go under `src/app/app/`. Admin pages under `src/app/admin/`. Public pages at the root of `src/app/`.
- Reusable UI under `src/components/ui/`. Domain components under `src/components/<feature>/`.
- Pure logic under `src/lib/<feature>/`. Tests mirror the structure under `tests/lib/`.

## Don'ts

- Don't import `process.env` directly outside of `lib/*` modules. Centralise.
- Don't use `localStorage` for business data. Ever.
- Don't add a feature flag library — for the pilot we're not big enough yet.
- Don't add an i18n library proactively. Wait until DD-175 lands.
