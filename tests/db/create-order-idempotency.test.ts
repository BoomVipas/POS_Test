// #67 fix-forward — create_order idempotency, end-to-end in pglite.
//
// The POS connectivity hedge keeps the cart on a failed confirm, which makes
// retry easy — but a thrown response doesn't prove the order wasn't committed.
// A client-generated client_request_id lets a retry replay to the SAME order
// instead of double-charging + double-decrementing. This pins that contract.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  bootDb,
  createOrder,
  seedWorkspace,
  type SeededWorkspace,
} from "./helpers/pglite";

let db: PGlite;

beforeAll(async () => {
  db = await bootDb(["create_order.sql"]);
});

afterAll(async () => {
  await db.close();
});

async function currentQty(ws: SeededWorkspace): Promise<number> {
  const r = await db.query<{ current_qty: number }>(
    `select current_qty from public.event_inventory
       where event_id = $1 and product_id = $2`,
    [ws.eventId, ws.productId],
  );
  return r.rows[0].current_qty;
}

const KEY_A = "11111111-1111-1111-1111-111111111111";
const KEY_B = "22222222-2222-2222-2222-222222222222";

describe("create_order idempotency (#67)", () => {
  let ws: SeededWorkspace;

  beforeEach(async () => {
    ws = await seedWorkspace(db); // current_qty starts at 100
  });

  it("a retry with the same client_request_id returns the SAME order and decrements once", async () => {
    const payload = {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      client_request_id: KEY_A,
      items: [{ product_id: ws.productId, qty: 2, fulfillment: "take_now" }],
    };

    const id1 = await createOrder(db, payload);
    const id2 = await createOrder(db, payload); // the retry

    expect(id2).toBe(id1); // same order, not a duplicate
    expect(await currentQty(ws)).toBe(98); // stock moved once, not twice

    const n = await db.query<{ n: number }>(
      `select count(*)::int as n from public.orders
         where workspace_id = $1 and client_request_id = $2`,
      [ws.workspaceId, KEY_A],
    );
    expect(n.rows[0].n).toBe(1);
  });

  it("different keys create distinct orders", async () => {
    const mk = (key: string) => ({
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      client_request_id: key,
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const id1 = await createOrder(db, mk(KEY_A));
    const id2 = await createOrder(db, mk(KEY_B));
    expect(id2).not.toBe(id1);
    expect(await currentQty(ws)).toBe(98); // two separate sales
  });

  it("orders without a key are never deduped (legacy behavior preserved)", async () => {
    const mk = () => ({
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const id1 = await createOrder(db, mk());
    const id2 = await createOrder(db, mk());
    expect(id2).not.toBe(id1);
    expect(await currentQty(ws)).toBe(98);
  });
});
