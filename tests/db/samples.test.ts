// Wave 39d — sample bucket conversions, end-to-end against the real schema in
// pglite. Proves the backend contract the live /app/inventory/samples page uses:
// convert_event_to_sample / convert_sample_to_event swap current_qty ↔ sample_qty
// atomically, refuse to underflow either side, reject non-positive qty, and write
// an audit row per move. The cap pre-check is unit-tested in tests/lib/sample-move.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { bootDb, seedWorkspace, type SeededWorkspace } from "./helpers/pglite";

let db: PGlite;

beforeAll(async () => {
  db = await bootDb([
    "convert_event_to_sample.sql",
    "convert_sample_to_event.sql",
  ]);
});

afterAll(async () => {
  await db.close();
});

type Qtys = { current_qty: number; sample_qty: number };

async function toSample(ws: SeededWorkspace, qty: number): Promise<Qtys> {
  const r = await db.query<Qtys>(
    `select current_qty, sample_qty
       from public.convert_event_to_sample($1, $2, $3, $4)`,
    [ws.eventId, ws.productId, qty, null],
  );
  return r.rows[0];
}

async function toEvent(ws: SeededWorkspace, qty: number): Promise<Qtys> {
  const r = await db.query<Qtys>(
    `select current_qty, sample_qty
       from public.convert_sample_to_event($1, $2, $3, $4)`,
    [ws.eventId, ws.productId, qty, null],
  );
  return r.rows[0];
}

describe("sample bucket conversions (Wave 39d)", () => {
  let ws: SeededWorkspace;

  beforeEach(async () => {
    // Fresh workspace each test: event_inventory starts at current_qty 100,
    // sample_qty 0 (see seedWorkspace).
    ws = await seedWorkspace(db);
  });

  it("moves event stock into the sample bucket", async () => {
    const after = await toSample(ws, 10);
    expect(after.current_qty).toBe(90);
    expect(after.sample_qty).toBe(10);
  });

  it("returns samples back to event stock", async () => {
    await toSample(ws, 10);
    const after = await toEvent(ws, 4);
    expect(after.current_qty).toBe(94);
    expect(after.sample_qty).toBe(6);
  });

  it("refuses to make more samples than event stock", async () => {
    await expect(toSample(ws, 101)).rejects.toThrow(/not enough event stock/i);
  });

  it("refuses to return more samples than exist", async () => {
    await toSample(ws, 5);
    await expect(toEvent(ws, 6)).rejects.toThrow(/not enough sample/i);
  });

  it("rejects a non-positive qty", async () => {
    await expect(toSample(ws, 0)).rejects.toThrow(/positive/i);
    await expect(toEvent(ws, -2)).rejects.toThrow(/positive/i);
  });

  it("writes one audit row per conversion", async () => {
    await toSample(ws, 3);
    await toEvent(ws, 1);
    const r = await db.query<{ action: string; n: number }>(
      `select action, count(*)::int as n from public.audit_logs
         where workspace_id = $1 group by action order by action`,
      [ws.workspaceId],
    );
    expect(r.rows).toEqual([
      { action: "convert_event_to_sample", n: 1 },
      { action: "convert_sample_to_event", n: 1 },
    ]);
  });
});
