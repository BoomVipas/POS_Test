// DD-51 — the products (workspace_id, sku) unique constraint, in real Postgres.
//
// SKUs are unique *within* a workspace, but two different tenants may use the
// same SKU. The createProduct Server Action relies on this constraint (catches
// 23505 → "SKU already exists"); these cases pin the DB guarantee.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { bootDb, seedWorkspace, type SeededWorkspace } from "./helpers/pglite";

let db: PGlite;
let A: SeededWorkspace;
let B: SeededWorkspace;

beforeAll(async () => {
  db = await bootDb([]);
  // seedWorkspace inserts one product 'S1' per workspace.
  A = await seedWorkspace(db);
  B = await seedWorkspace(db);
});

afterAll(async () => {
  await db.close();
});

async function insertProduct(workspaceId: string, sku: string): Promise<void> {
  await db.query(
    `insert into public.products(workspace_id, sku, name, price_satang)
     values ($1, $2, $3, 1000)`,
    [workspaceId, sku, `Item ${sku}`],
  );
}

describe("products (workspace_id, sku) uniqueness (DD-51)", () => {
  it("allows the same SKU in two different workspaces", async () => {
    // Both seeds created an 'S1' — so the same SKU already coexists across tenants.
    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from public.products where sku = 'S1'`,
    );
    expect(r.rows[0].n).toBe(2);
    expect(A.workspaceId).not.toBe(B.workspaceId);
  });

  it("rejects a duplicate SKU within the same workspace", async () => {
    await expect(insertProduct(A.workspaceId, "S1")).rejects.toThrow(
      /duplicate key|unique/i,
    );
  });

  it("accepts a distinct SKU within the same workspace", async () => {
    await insertProduct(A.workspaceId, "S2");
    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from public.products where workspace_id = $1`,
      [A.workspaceId],
    );
    expect(r.rows[0].n).toBe(2); // S1 (seed) + S2
  });
});
