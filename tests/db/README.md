# Database function tests (`tests/db/`)

These tests exercise the PL/pgSQL functions in `database/functions/` against a
**real Postgres** — [pglite](https://github.com/electric-sql/pglite), Postgres
compiled to WASM, running in-process under Node. No Docker, no external service,
no CI infra: `npm test` runs them like any other Vitest file.

## Why pglite (and not sql-mock / pgTAP / Docker)

Wave 41's plan (`TASKS.md`, batch 41k) defaulted to **sql-mock** to avoid an
infra dependency, with Dockerised Postgres or pgTAP as fallbacks. During 41g we
chose pglite instead because:

- A string/SQL mock can't *execute* PL/pgSQL — it can only assert on text. The
  D-series findings (D1–D6) are behavioural (a guard raises / doesn't, a value
  is capped, an error message collapses), so they need the real interpreter.
- pgTAP and Docker both require a running Postgres; pglite needs neither.

So pglite gives genuine repros with zero infra. **This choice was flagged for
Codex post-hoc review** — the original plan asked for review before 41g, but the
work proceeded under the founder's run-non-stop directive.

## What the harness does (`helpers/pglite.ts`)

- `bootDb(functionFiles)` — boots an in-memory database, installs the stubs
  below, loads `database/schema.sql`, then loads the named function files.
- `seedWorkspace(db)` — inserts a fresh, isolated workspace (owner + running
  event + one product stocked at 100) and sets `auth.uid()` to the owner.
- `createOrder(db, payload)` — calls `public.create_order(payload)`.

### Stubs and SQL rewrites (test-only)

pglite is vanilla Postgres, so it lacks the Supabase-specific surface the schema
leans on. The harness compensates:

| Need | Why it's missing | Shim |
|------|------------------|------|
| `auth.users`, `auth.uid()` | Supabase Auth schema | created before the schema loads; `auth.uid()` reads the `test.user_id` GUC |
| `gen_random_bytes(int)` | lives in the `pgcrypto` extension, which we don't load | non-crypto SQL shim; **adversarial-injectable** via the `test.strip_heavy_rolls` GUC so D6 has a deterministic repro |
| `create extension pgcrypto` | not bundled; `gen_random_uuid()` is core in PG13+ | stripped on load |
| `grant`/`revoke ... to authenticated/anon` | those roles don't exist here and don't affect behaviour | stripped on load |

> The `gen_random_bytes` shim is **not** cryptographically meaningful — it only
> exercises token *shaping* and the length floor, never randomness quality.

## Adding a test

```ts
import { bootDb, seedWorkspace, createOrder } from "./helpers/pglite";

let db;
beforeAll(async () => { db = await bootDb(["create_order.sql"]); });
afterAll(async () => { await db.close(); });
```

Seed a fresh workspace per `describe` (uuids are unique each call, so blocks
don't collide). A PL/pgSQL `raise exception` aborts and rolls back the whole
function call, so failed-path tests leave no rows behind.

## Coverage

`d-series-coverage.test.ts` is a guard: it fails if any of findings **D1–D6**
loses its pinning test. Run just this layer with `npm run test:db`.
