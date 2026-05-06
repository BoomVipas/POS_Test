# Migrations

Each file in this directory is an **idempotent SQL migration** intended to bring a Supabase Postgres database from "schema as of date X" to "schema as of date Y".

## Conventions

### Filename

`YYYY-MM-DD_short_slug.sql` — date first so files sort chronologically. Use the date the migration *landed on `main`*, not the date you started writing it.

### Idempotent

Every migration must be safe to run multiple times on the same database. Patterns:

- `create table if not exists ...` for tables.
- `create index if not exists ...` for indexes.
- `alter table ... add column if not exists ...` for new columns.
- For check / unique constraints (PostgreSQL has no `if not exists` for these), wrap in a `do $$` block guarded by a `pg_constraint` lookup:

  ```sql
  do $$
  begin
    if not exists (
      select 1 from pg_constraint where conname = 'my_constraint_name'
    ) then
      alter table public.my_table
        add constraint my_constraint_name check (...);
    end if;
  end $$;
  ```

- For triggers, use `drop trigger if exists ... ; create trigger ...`.
- Functions go in `database/functions/` as `create or replace function`, idempotent by definition.

### Source-of-truth

`database/schema.sql` is the source of truth for the **current** schema shape. Migrations exist so an existing dev/staging/prod DB can be moved forward without dropping data. After applying a migration, the resulting schema must match `schema.sql` exactly.

### How to apply

```bash
# Against a Supabase project (replace <project> with your project ref):
psql "postgresql://postgres:[YOUR-PASSWORD]@db.<project>.supabase.co:5432/postgres" \
  -f database/migrations/2026-05-07_customer_portal.sql

# Or via the Supabase SQL editor: paste the file contents and run.
```

After every applied migration, **verify the result** by running `\d+ table_name` for each touched table and confirming the new columns / constraints / indexes are present.

### Order

Migrations are applied in filename-sort order (chronological). If two migrations have the same date, suffix the slug to disambiguate (e.g. `2026-05-07_a_first.sql`, `2026-05-07_b_second.sql`).

### Supabase CLI alternative

If/when the project wires the Supabase CLI, migrations can be tracked via `supabase migration` instead. Until then, this directory is the canonical record.

### When to write a migration

- **Schema changes** to `database/schema.sql` (new column, new table, new constraint, new trigger).
- **Function changes** that affect existing function signatures (the function file is idempotent on its own; the migration captures *when* the change shipped).
- **Data shape changes** (e.g. backfilling a NOT NULL column).

You do **not** need a migration for:

- New `database/functions/*.sql` files — those are idempotent `create or replace`. Apply directly.
- RLS policy edits — `database/rls-policies.sql` uses `drop policy if exists` + `create policy`, so re-applying the whole file is safe.

## Index of migrations

| File | What it does | Wave |
|---|---|---|
| `2026-05-07_add_sample_qty.sql` | Add `event_inventory.sample_qty` column + check ≥ 0. Adds the persistent event-long sample bucket per meowmeow Batch DD. | 39a |
| `2026-05-07_customer_portal.sql` | Add Customer Portal tables (`customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`) + triggers. Implements the post-purchase relationship layer per VISION.md. | 40a |
