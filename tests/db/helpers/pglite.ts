// Wave 41g/41k — pglite test harness for the database functions.
//
// pglite is real Postgres compiled to WASM: it runs in-process under Node with
// no Docker and no external service, yet executes plpgsql for real (unlike a
// SQL string mock). That lets the D-series findings get genuine repros — we
// call `create_order(payload)` and assert on what it actually does to the rows.
//
// What we stub: Supabase's `auth` schema (`auth.users`, `auth.uid()`) which the
// real schema's foreign keys and `is_workspace_member` depend on. `auth.uid()`
// reads a session GUC so a test can act as a specific seeded user.
//
// What we strip when loading SQL: the `create extension pgcrypto` line
// (`gen_random_uuid()` is core in PG13+, so the extension is unnecessary) and
// the `grant`/`revoke` lines (they reference the Supabase `authenticated` role,
// which doesn't exist here and isn't relevant to function behaviour).

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(here, "../../../database");

function readSql(rel: string): string {
  return readFileSync(path.join(dbDir, rel), "utf8")
    .replace(/create extension[^;]*;/gi, "")
    .replace(/^\s*(revoke|grant)\b[^;]*;/gim, "");
}

/**
 * Boot a fresh in-memory database with the auth stub, full schema, and the
 * named function files loaded. Call once per test file (beforeAll).
 */
export async function bootDb(functionFiles: string[]): Promise<PGlite> {
  const db = await PGlite.create();
  // auth stub must exist before schema FKs reference auth.users.
  await db.exec(`
    create schema if not exists auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz default now()
    );
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.user_id', true), '')::uuid
    $$;
  `);
  // gen_random_bytes lives in the pgcrypto extension, which we don't load (only
  // gen_random_uuid is core). The token generator under test calls it, so we
  // provide a NON-cryptographic test shim: enough to exercise token shaping /
  // the length floor, never used to assess randomness quality.
  //
  // The shim is adversarial-injectable: while the GUC `test.strip_heavy_rolls`
  // is > 0, the first that-many calls return all-0xFF bytes (which base64-encode
  // to all '/' and strip to an empty string), letting a test deterministically
  // force the strip-heavy path that the D6 length floor must survive. Reset the
  // sequence to 0 before using it. Defaults to clean pseudo-random bytes.
  await db.exec(`
    create sequence if not exists public._grb_call_no;
    create or replace function public.gen_random_bytes(n int)
    returns bytea language plpgsql volatile as $$
    declare
      v_heavy int := coalesce(nullif(current_setting('test.strip_heavy_rolls', true), ''), '0')::int;
    begin
      if v_heavy > 0 and nextval('public._grb_call_no') <= v_heavy then
        return decode(repeat('ff', n), 'hex');
      end if;
      return decode(
        (select string_agg(lpad(to_hex((random() * 255)::int), 2, '0'), '')
           from generate_series(1, n)),
        'hex'
      );
    end $$;
  `);
  await db.exec(readSql("schema.sql"));
  for (const f of functionFiles) {
    await db.exec(readSql(path.join("functions", f)));
  }
  return db;
}

export interface SeededWorkspace {
  userId: string;
  workspaceId: string;
  eventId: string;
  /** product_id of the single seeded product (price 10000 satang, stock 100). */
  productId: string;
}

/**
 * Seed a fresh, fully-isolated workspace (new uuids each call) with one owner,
 * one running event, and one product stocked at 100. Sets `auth.uid()` to the
 * seeded owner so subsequent `create_order` calls pass the membership check.
 */
export async function seedWorkspace(db: PGlite): Promise<SeededWorkspace> {
  const r = await db.query<{
    uid: string;
    wsid: string;
    eid: string;
    pid: string;
  }>(`
    with u as (insert into auth.users default values returning id),
    ws as (
      insert into public.workspaces(brand_name, slug, owner_user_id, industry, status, setup_complete)
      select 'Test Brand', 'test-' || substr(gen_random_uuid()::text,1,8), id, 'cat_product', 'active', true
      from u returning id, owner_user_id
    ),
    m as (
      insert into public.workspace_members(workspace_id, user_id, role)
      select ws.id, ws.owner_user_id, 'owner' from ws returning workspace_id
    ),
    p as (
      insert into public.products(workspace_id, sku, name, category, price_satang, default_starting_qty, send_later_enabled)
      select id, 'S1', 'Item', 'toys', 10000, 100, true from ws returning id, workspace_id
    ),
    e as (
      insert into public.events(workspace_id, name, venue, start_date, end_date, status)
      select id, 'E', 'V', current_date, current_date + 3, 'running' from ws returning id, workspace_id
    ),
    inv as (
      insert into public.event_inventory(workspace_id, event_id, product_id, starting_qty, current_qty)
      select e.workspace_id, e.id, p.id, 100, 100 from e, p returning id
    )
    select (select id from u) uid, (select id from ws) wsid,
           (select id from e) eid, (select id from p) pid
  `);
  const { uid, wsid, eid, pid } = r.rows[0];
  await db.exec(`set test.user_id = '${uid}';`);
  return { userId: uid, workspaceId: wsid, eventId: eid, productId: pid };
}

/** Call `public.create_order(payload)` and return the new order id. */
export async function createOrder(
  db: PGlite,
  payload: Record<string, unknown>,
): Promise<string> {
  const r = await db.query<{ oid: string }>(
    `select public.create_order($1::jsonb) as oid`,
    [JSON.stringify(payload)],
  );
  return r.rows[0].oid;
}
