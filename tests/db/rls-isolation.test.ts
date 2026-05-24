// DD-42 — RLS tenant-isolation test.
//
// CLAUDE.md hard rules #2/#3: every business table carries workspace_id and has
// RLS on. This test proves the shipped policies actually isolate tenants — user
// A cannot SELECT user B's rows — by running real queries *through* the policies
// in pglite (helpers/pglite.ts → bootRlsDb), acting as the `authenticated` role.
//
// "Red without policies; green with them" (the DD-42 acceptance bar) is encoded
// in the final control case: with RLS disabled the identical query leaks both
// tenants' rows; with the shipped policy enabled, each user sees only their own.

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  bootRlsDb,
  seedWorkspace,
  actAs,
  actAsSuperuser,
  type SeededWorkspace,
} from "./helpers/pglite";

let db: PGlite;
let A: SeededWorkspace;
let B: SeededWorkspace;

const NO_MEMBERSHIP_UID = "00000000-0000-0000-0000-000000000000";

beforeAll(async () => {
  db = await bootRlsDb();
  // Seeded as the bootstrap superuser (RLS-exempt) — two fully separate tenants,
  // each with its own owner, workspace, event, product, and inventory row.
  A = await seedWorkspace(db);
  B = await seedWorkspace(db);
  await actAsSuperuser(db);
});

afterAll(async () => {
  await db.close();
});

afterEach(async () => {
  // Never leak role / auth.uid() state between cases.
  await actAsSuperuser(db);
});

async function colValues(sql: string): Promise<string[]> {
  const r = await db.query<{ v: string }>(sql);
  return r.rows.map((x) => x.v);
}

async function count(sql: string): Promise<number> {
  const r = await db.query<{ n: number }>(sql);
  return r.rows[0].n;
}

describe("RLS tenant isolation (DD-42)", () => {
  it("seeds two distinct tenants the RLS-exempt superuser can both see", async () => {
    expect(A.workspaceId).not.toBe(B.workspaceId);
    expect(await count(`select count(*)::int n from public.products`)).toBe(2);
    expect(await count(`select count(*)::int n from public.workspaces`)).toBe(2);
  });

  it("user A sees only their own products", async () => {
    await actAs(db, A.userId);
    const ws = await colValues(
      `select workspace_id as v from public.products`,
    );
    expect(ws).toEqual([A.workspaceId]);
    expect(ws).not.toContain(B.workspaceId);
  });

  it("user B sees only their own products", async () => {
    await actAs(db, B.userId);
    const ws = await colValues(
      `select workspace_id as v from public.products`,
    );
    expect(ws).toEqual([B.workspaceId]);
    expect(ws).not.toContain(A.workspaceId);
  });

  it("the workspaces row is visible only to its members", async () => {
    await actAs(db, A.userId);
    expect(await colValues(`select id as v from public.workspaces`)).toEqual([
      A.workspaceId,
    ]);
    await actAs(db, B.userId);
    expect(await colValues(`select id as v from public.workspaces`)).toEqual([
      B.workspaceId,
    ]);
  });

  it("event_inventory is isolated to the owning workspace", async () => {
    await actAs(db, A.userId);
    const ws = await colValues(
      `select workspace_id as v from public.event_inventory`,
    );
    expect(ws).toEqual([A.workspaceId]);
  });

  it("an authenticated user with no membership sees nothing", async () => {
    await actAs(db, NO_MEMBERSHIP_UID);
    expect(await count(`select count(*)::int n from public.products`)).toBe(0);
    expect(await count(`select count(*)::int n from public.workspaces`)).toBe(0);
    expect(
      await count(`select count(*)::int n from public.event_inventory`),
    ).toBe(0);
  });

  it("control: the policy is what isolates — disabling RLS leaks both tenants", async () => {
    // Shipped policy ON: user A sees exactly their 1 product.
    await actAs(db, A.userId);
    expect(await count(`select count(*)::int n from public.products`)).toBe(1);

    // Drop the guard → the identical query now leaks BOTH tenants' rows (red).
    await actAsSuperuser(db);
    await db.exec(`alter table public.products disable row level security;`);
    await actAs(db, A.userId);
    expect(await count(`select count(*)::int n from public.products`)).toBe(2);

    // Restore the guard → isolated again (green).
    await actAsSuperuser(db);
    await db.exec(`alter table public.products enable row level security;`);
    await actAs(db, A.userId);
    expect(await count(`select count(*)::int n from public.products`)).toBe(1);
  });
});
