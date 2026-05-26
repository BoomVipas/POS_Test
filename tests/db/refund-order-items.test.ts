// Wave 48 — refund_order_items, end-to-end in pglite. Proves the partial-refund
// contract /app/correction relies on: per-line refund records an order_refunds
// row, restores event_inventory (current_qty += qty, sold_qty −= qty), caps qty
// at remaining, requires a reason, refuses voided orders, and writes one audit
// row per call.

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
  db = await bootDb(["create_order.sql", "refund_order_items.sql"]);
});

afterAll(async () => {
  await db.close();
});

async function inv(ws: SeededWorkspace): Promise<{ current_qty: number; sold_qty: number }> {
  const r = await db.query<{ current_qty: number; sold_qty: number }>(
    `select current_qty, sold_qty from public.event_inventory
       where event_id = $1 and product_id = $2`,
    [ws.eventId, ws.productId],
  );
  return r.rows[0];
}

async function refund(
  orderId: string,
  lines: Array<{ order_item_id: string; qty: number }>,
  reason: string,
): Promise<void> {
  await db.query(`select public.refund_order_items($1, $2::jsonb, $3)`, [
    orderId,
    JSON.stringify(lines),
    reason,
  ]);
}

describe("refund_order_items (Wave 48)", () => {
  let ws: SeededWorkspace;
  let orderId: string;
  let itemId: string;

  beforeEach(async () => {
    ws = await seedWorkspace(db); // current_qty 100
    orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 3, fulfillment: "take_now" }],
    });
    const r = await db.query<{ id: string }>(
      `select id from public.order_items where order_id = $1 limit 1`,
      [orderId],
    );
    itemId = r.rows[0].id;
  });

  it("partial refund: records the refund, restores stock, and caps at remaining", async () => {
    expect(await inv(ws)).toEqual({ current_qty: 97, sold_qty: 3 });

    await refund(orderId, [{ order_item_id: itemId, qty: 1 }], "damaged on display");
    expect(await inv(ws)).toEqual({ current_qty: 98, sold_qty: 2 });

    const agg = await db.query<{ n: number; q: number }>(
      `select count(*)::int as n, coalesce(sum(qty),0)::int as q
         from public.order_refunds where order_id = $1`,
      [orderId],
    );
    expect(agg.rows[0]).toEqual({ n: 1, q: 1 });

    // another 1 (remaining was 2)
    await refund(orderId, [{ order_item_id: itemId, qty: 1 }], "customer changed mind");
    expect(await inv(ws)).toEqual({ current_qty: 99, sold_qty: 1 });

    // only 1 remaining now → refunding 2 must be rejected
    await expect(
      refund(orderId, [{ order_item_id: itemId, qty: 2 }], "too much"),
    ).rejects.toThrow(/exceeds remaining/i);
  });

  it("requires a reason (>= 3 chars)", async () => {
    await expect(
      refund(orderId, [{ order_item_id: itemId, qty: 1 }], ""),
    ).rejects.toThrow(/reason/i);
  });

  it("refuses to refund a voided order", async () => {
    await db.exec(`update public.orders set status='voided' where id='${orderId}'`);
    await expect(
      refund(orderId, [{ order_item_id: itemId, qty: 1 }], "valid reason here"),
    ).rejects.toThrow(/voided/i);
  });

  it("writes one audit row per refund call", async () => {
    await refund(orderId, [{ order_item_id: itemId, qty: 1 }], "damaged item");
    const a = await db.query<{ n: number }>(
      `select count(*)::int as n from public.audit_logs
         where workspace_id = $1 and action = 'refund_order_items'`,
      [ws.workspaceId],
    );
    expect(a.rows[0].n).toBe(1);
  });

  it("records the DISCOUNT-ADJUSTED amount, not the sticker price (Codex #87)", async () => {
    // Separate order on the same workspace: 2 × 10000 = 20000 subtotal, 5000
    // discount → customer paid 15000 (7500/unit). Refunding 1 unit must record
    // 7500, NOT the 10000 sticker price.
    const oid = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      discount_satang: 5000,
      items: [{ product_id: ws.productId, qty: 2, fulfillment: "take_now" }],
    });
    const r = await db.query<{ id: string }>(
      `select id from public.order_items where order_id = $1 limit 1`,
      [oid],
    );
    await refund(oid, [{ order_item_id: r.rows[0].id, qty: 1 }], "one unit back");
    const ref = await db.query<{ amount: number }>(
      `select amount_satang as amount from public.order_refunds where order_id = $1`,
      [oid],
    );
    expect(ref.rows[0].amount).toBe(7500);
  });
});
