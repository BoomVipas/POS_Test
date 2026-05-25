import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { bootDb, seedWorkspace } from "./helpers/pglite";

// #17 — runs the real adjust_event_stock RPC in pglite (seeded product starts
// at current_qty 100, owner acting), proving the qty math + audit + guards.

let db: PGlite;
beforeAll(async () => {
  db = await bootDb(["adjust_event_stock.sql"]);
});
afterAll(async () => {
  await db?.close();
});

async function adjust(
  s: { eventId: string; productId: string },
  delta: number,
  reason?: string,
) {
  const r = await db.query<{ current_qty: number; adjusted_qty: number }>(
    "select current_qty, adjusted_qty from public.adjust_event_stock($1::uuid,$2::uuid,$3::int,$4::text)",
    [s.eventId, s.productId, delta, reason ?? null],
  );
  return r.rows[0];
}

describe("adjust_event_stock", () => {
  it("restocks (+delta), tracks adjusted_qty, and writes one audit row", async () => {
    const s = await seedWorkspace(db);
    const row = await adjust(s, 50, "topped up the booth");
    expect(row.current_qty).toBe(150);
    expect(row.adjusted_qty).toBe(50);

    const audit = await db.query<{ n: number }>(
      `select count(*)::int as n from public.audit_logs
         where action = 'adjust_event_stock'
           and target_id = (select id from public.event_inventory
                            where event_id = $1 and product_id = $2)`,
      [s.eventId, s.productId],
    );
    expect(audit.rows[0].n).toBe(1);
  });

  it("corrects downward (-delta)", async () => {
    const s = await seedWorkspace(db);
    const row = await adjust(s, -30);
    expect(row.current_qty).toBe(70);
    expect(row.adjusted_qty).toBe(-30);
  });

  it("refuses to drive stock below zero", async () => {
    const s = await seedWorkspace(db);
    await expect(adjust(s, -200)).rejects.toThrow(/below zero/);
  });

  it("rejects a zero delta", async () => {
    const s = await seedWorkspace(db);
    await expect(adjust(s, 0)).rejects.toThrow(/non-zero/);
  });
});
