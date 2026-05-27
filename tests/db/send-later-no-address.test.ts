// Wave 58d — regression anchor for DD-76 (issue #311).
//
// Documents the CURRENT (pre-DD-76) behaviour: when the cashier confirms a
// send_later order without entering a shipping address, create_order does NOT
// raise — it silently stores 'TBD' in send_later_orders.shipping_address
// (via `coalesce(nullif(payload->>'shipping_address', ''), 'TBD')`).
//
// PURPOSE OF THIS TEST: to turn RED the moment DD-76 lands the required-address
// guard inside create_order (the RPC will start raising instead of defaulting to
// 'TBD'). That red test is the regression anchor that confirms DD-76's fix is in
// place. Until then, this test documents the gap and prevents a silent revert.
//
// Do NOT delete this test when DD-76 ships — change the expectation to match the
// new raise behavior (and rename accordingly).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

describe("send_later without address — pre-DD-76 'TBD' default (issue #311)", () => {
  let ws: SeededWorkspace;

  beforeAll(async () => {
    ws = await seedWorkspace(db);
  });

  it("send_later order with no shipping_address stores 'TBD' (not a raise)", async () => {
    // Cashier confirms a send_later item but supplies no shipping_address.
    // DD-76 will change this to a raise; until then the RPC silently defaults
    // to 'TBD'. This test pins that gap so the change is visible.
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      customer_name: "Test Customer",
      customer_phone: "0819999999",
      // shipping_address intentionally omitted
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "send_later" }],
    });

    const r = await db.query<{ shipping_address: string }>(
      `select shipping_address from public.send_later_orders where order_id = $1`,
      [orderId],
    );
    expect(r.rows).toHaveLength(1);
    // Pre-DD-76: the coalesce() default is 'TBD'.
    // When DD-76 ships this assertion changes to `rejects` (the order creation
    // must throw instead of recording a placeholder address).
    expect(r.rows[0].shipping_address).toBe("TBD");
  });

  it("send_later order with empty string shipping_address also stores 'TBD'", async () => {
    // nullif('', '') returns null, then coalesce(null, 'TBD') = 'TBD'.
    // Covers the case where the builder sends an empty string.
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      customer_name: "Empty Address",
      customer_phone: "0818888888",
      shipping_address: "",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "send_later" }],
    });

    const r = await db.query<{ shipping_address: string }>(
      `select shipping_address from public.send_later_orders where order_id = $1`,
      [orderId],
    );
    expect(r.rows[0].shipping_address).toBe("TBD");
  });

  it("send_later order with a real address stores it verbatim (happy path still works)", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      customer_name: "Aroon",
      customer_phone: "0817777777",
      shipping_address: "99 Rama IV, Bangkok 10110",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "send_later" }],
    });

    const r = await db.query<{ shipping_address: string }>(
      `select shipping_address from public.send_later_orders where order_id = $1`,
      [orderId],
    );
    expect(r.rows[0].shipping_address).toBe("99 Rama IV, Bangkok 10110");
  });
});
