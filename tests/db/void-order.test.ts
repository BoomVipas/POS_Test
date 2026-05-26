// DD-96 — void_order, end-to-end against the real schema in pglite. Proves the
// contract the live /app/correction page relies on: voiding restores
// event_inventory, flips the order to voided, cancels open send-later
// fulfillment, writes an audit row, and refuses to double-void or void without a
// reason. The reason-length pre-check is unit-tested in tests/lib/void-reason.

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
  db = await bootDb(["create_order.sql", "void_order.sql"]);
});

afterAll(async () => {
  await db.close();
});

async function voidOrder(orderId: string, reason: string): Promise<void> {
  await db.query(`select public.void_order($1, $2)`, [orderId, reason]);
}

async function inv(ws: SeededWorkspace): Promise<{ current_qty: number; sold_qty: number }> {
  const r = await db.query<{ current_qty: number; sold_qty: number }>(
    `select current_qty, sold_qty from public.event_inventory
       where event_id = $1 and product_id = $2`,
    [ws.eventId, ws.productId],
  );
  return r.rows[0];
}

describe("void_order (DD-96)", () => {
  let ws: SeededWorkspace;

  beforeEach(async () => {
    ws = await seedWorkspace(db);
  });

  it("restores inventory, flips the order to voided, and writes an audit row", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 3, fulfillment: "take_now" }],
    });
    expect(await inv(ws)).toEqual({ current_qty: 97, sold_qty: 3 });

    await voidOrder(orderId, "rang up the wrong item");

    expect(await inv(ws)).toEqual({ current_qty: 100, sold_qty: 0 });
    const o = await db.query<{ status: string; payment_status: string; void_reason: string }>(
      `select status, payment_status, void_reason from public.orders where id = $1`,
      [orderId],
    );
    expect(o.rows[0].status).toBe("voided");
    expect(o.rows[0].payment_status).toBe("voided");
    expect(o.rows[0].void_reason).toBe("rang up the wrong item");

    const audit = await db.query<{ n: number }>(
      `select count(*)::int as n from public.audit_logs
         where workspace_id = $1 and action = 'void_order' and target_id = $2`,
      [ws.workspaceId, orderId],
    );
    expect(audit.rows[0].n).toBe(1);
  });

  it("cancels open send-later fulfillment when the order is voided", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      customer_name: "Nok",
      customer_phone: "0810000000",
      shipping_address: "1 Bangkok",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "send_later" }],
    });
    await voidOrder(orderId, "customer cancelled");
    const sl = await db.query<{ fulfillment_status: string }>(
      `select fulfillment_status from public.send_later_orders where order_id = $1`,
      [orderId],
    );
    expect(sl.rows[0].fulfillment_status).toBe("cancelled");
  });

  it("refuses to void twice", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    await voidOrder(orderId, "first void");
    await expect(voidOrder(orderId, "second void")).rejects.toThrow(
      /already voided/i,
    );
  });

  it("requires a non-empty reason", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    await expect(voidOrder(orderId, "   ")).rejects.toThrow(/reason is required/i);
  });
});
