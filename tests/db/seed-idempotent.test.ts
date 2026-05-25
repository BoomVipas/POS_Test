// Regression guard for the seed.sql idempotency fix.
//
// The demo-event insert originally used `on conflict do nothing`, but `events`
// has no unique constraint for that to fire against — so a second `seed.sql`
// run piled up a duplicate "Pilot Demo Expo". The fix find-or-creates the event
// by (workspace_id, name). This test runs the whole seed twice and asserts a
// single demo workspace/event/inventory set survives. (On the pre-fix seed the
// events count would be 2.)

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootDb } from "./helpers/pglite";

const here = path.dirname(fileURLToPath(import.meta.url));
const seedSql = readFileSync(
  path.resolve(here, "../../database/seed.sql"),
  "utf8",
);

let db: PGlite;

beforeAll(async () => {
  // bootDb gives us the schema + the auth.users stub; seed.sql needs one user.
  db = await bootDb([]);
  await db.query(`insert into auth.users default values`);
});

afterAll(async () => {
  await db.close();
});

async function count(table: string): Promise<number> {
  const r = await db.query<{ n: number }>(
    `select count(*)::int as n from public.${table}`,
  );
  return r.rows[0].n;
}

describe("seed.sql idempotency", () => {
  it("running the seed twice leaves exactly one demo workspace/event/inventory", async () => {
    await db.exec(seedSql);
    await db.exec(seedSql); // second run must not duplicate anything

    expect(await count("admin_users")).toBe(1);
    expect(await count("workspaces")).toBe(1);
    expect(await count("workspace_members")).toBe(1);
    expect(await count("products")).toBe(5);
    expect(await count("events")).toBe(1); // the bug: was 2 on a repeat run
    expect(await count("event_inventory")).toBe(5);
  });
});
