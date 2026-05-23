# ADR 2026-05-24 — Wave 41: Pre-Supabase hardening sweep

- **Status:** Accepted (41a–41d, 41f–41k shipped). 41e deferred — needs founder sign-off.
- **Date:** 2026-05-24
- **Context source:** a `/debug-mantra` read-only audit of the full `pos-for-sell` tree, 2026-05-24. Findings tagged **L1–L6** (live, hittable in today's demo app) and **D1–D6** (latent, on the Supabase RPCs that activate when DD-65 wires the cashier flow).

## Why this wave existed

DD-65 will point the cashier flow at the real Supabase RPCs (`create_order`,
`create_registration_token`, `claim_registration_token`). The audit found a set
of issues that are invisible today (demo mode never calls those RPCs) but become
real bugs the moment the wiring lands — plus a few UX/auth honesty gaps visible
right now. Fixing them *before* the wire-up means DD-65 lands on hardened
functions instead of inheriting six latent defects.

**Discipline:** every sub-batch landed a failing test before its fix (the
"no fix without a repro" contract). One sub-batch = one PR = one squash-merge.

## Decisions

### Live thread (L-series)

| # | Finding | Decision | PR |
|---|---------|----------|----|
| L1 (41a) | Discount could exceed cart total | Cap at subtotal+shipping; inline "capped" hint; receipt records capped value | #94 |
| L3 (41b) | Mock admin Approve/Reject fired fake success | Toasts now say "Not yet wired — DD-26"; caption beside buttons | #96 |
| L6 (41c) | `validateSplits` accepted negative lines | New `negative` reason runs before empty/short/over; localized chip | #95 |
| L4 (41d) | Was `src/proxy.ts` actually wired by Next 16? | Verified yes (Turbopack `functions-config-manifest.json`); pinned by build-output test + documenting comment | #93 |
| **L5 (41e)** | **Orphan auth user (no `workspace_members` row) silently falls into demo mode** | **DEFERRED — see Open question** | — |
| L2 (41f) | `/apply` unlimited POSTs + 23505 duplicate-email enumeration oracle | App-level rate limit (IP + sha256(email), 5/hr) + collapse duplicate path to generic success | #97 |

### Latent thread (D-series) — all on `create_order` / token RPCs

| # | Finding | Decision | PR |
|---|---------|----------|----|
| D1 (41g) | `payment_method=mixed` + empty payments → completed "paid" order with **zero** payment records | Raise unless `payments[]` is non-empty | #98 |
| D2 (41g) | Supplied `payments[]` never validated against total | Raise on mismatch, naming the off-by satang | #98 |
| D3 (41h) | Client discount persisted into `orders.discount_satang` unchecked (total clamped, value not) | Cap at subtotal+shipping; persist capped value; audit breadcrumb `discount_capped` | #99 |
| D4 (41i) | Dead `case … then 'paid' else 'paid' end` | Collapse to literal `'paid'`; a future `pending` (awaiting-tender) state belongs to the cashier-flow batch | #100 |
| D5 (41j) | `claim_registration_token` raised 3 distinguishable errors = enumeration oracle | One generic `invalid token`; reason to `RAISE LOG` | #101 |
| D6 (41j) | Token generator could ship < 16 chars after url-unsafe stripping | Re-roll below the floor; 18 raw bytes for headroom | #101 |

### Test infrastructure — pglite (supersedes the planned sql-mock default)

The 41k plan defaulted to **sql-mock** to avoid an infra dependency and asked
for Codex review before 41g. The D-series findings are behavioural (a guard
raises or doesn't, a value is capped, a message collapses), so a string mock
can't validate them — it can only assert on SQL text.

**Decision:** use [pglite](https://github.com/electric-sql/pglite) — Postgres
compiled to WASM, running in-process under Node. It executes the real PL/pgSQL,
needs no Docker and no external service, and runs under plain `npm test`. This
is strictly more conservative than sql-mock (real execution > text assertion)
while keeping the zero-infra property the plan wanted.

> ⚠ This choice was made *during* 41g and proceeded without the pre-41g Codex
> review the plan requested, under the founder's run-non-stop directive. **It is
> flagged here for Codex post-hoc review.** Harness + rationale: `tests/db/README.md`.

The harness stubs the Supabase `auth` schema and `gen_random_bytes` (pgcrypto,
not loaded) and strips `create extension` / `grant` / `revoke` on load. The
`gen_random_bytes` shim is non-cryptographic and adversarial-injectable so D6
has a deterministic repro.

## Consequences

- DD-65 inherits hardened RPCs: mixed-payment integrity, discount sanity, and a
  non-oracle token surface are guaranteed by 16 db-layer tests (`npm run test:db`).
- A new test layer (`tests/db/`) and dev dependency (`@electric-sql/pglite`)
  now exist. DB function changes are expected to ship with a pglite test.
- `d-series-coverage.test.ts` fails if any D1–D6 loses its pinning test.
- Total suite grew 375 → 398 tests across the wave.

## Open question (blocks 41e)

**L5 — orphan-user → demo-mode behaviour in `/app` layout.** Today an
authenticated user with no `workspace_members` row falls into demo mode and sees
localStorage data. Post-Supabase that is surprising: a *removed* seller would
still see (their own) demo data instead of being told they have no workspace.

Two options, founder's call:

1. **Keep as a feature** — demo mode is a friendly sandbox for not-yet-onboarded
   users; document it as intended.
2. **Redirect to `/onboarding`** — treat "authenticated but workspace-less" as an
   onboarding-incomplete state and route there; ships with a layout change + test.

41e is deferred until this is decided; it does not block DD-65.
