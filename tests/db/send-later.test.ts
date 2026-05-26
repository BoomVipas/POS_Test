// DD-77/79 — Send-later queue, end-to-end against the real schema in pglite.
//
// Proves the backend contract the live /app/send-later page depends on:
//   1. create_order with a send_later line writes ONE send_later_orders row
//      (status 'pending') carrying the customer + shipping fields, and tags the
//      order/order_item as send_later.
//   2. that row is updatable through the status flow with its timestamp stamped
//      — the same UPDATE the setSendLaterStatus Server Action issues.
// The transition *rules* (what's allowed) are unit-tested in tests/lib/send-later;
// here we pin that the schema accepts the writes and create_order seeds the queue.

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

type SLRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_method: string | null;
  fulfillment_status: string;
  tracking_number: string | null;
  packed_at: string | null;
  shipped_at: string | null;
};

async function sendLaterRowForOrder(orderId: string): Promise<SLRow | null> {
  const r = await db.query<SLRow>(
    `select id, customer_name, customer_phone, shipping_address, shipping_method,
            fulfillment_status, tracking_number, packed_at, shipped_at
       from public.send_later_orders where order_id = $1`,
    [orderId],
  );
  return r.rows[0] ?? null;
}

describe("send-later queue (DD-77/79)", () => {
  let ws: SeededWorkspace;

  beforeAll(async () => {
    ws = await seedWorkspace(db);
  });

  it("create_order with a send_later line seeds one pending queue row with shipping fields", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      customer_name: "Aroon",
      customer_phone: "0810000000",
      shipping_address: "123 Sukhumvit, Bangkok",
      shipping_method: "Kerry",
      items: [{ product_id: ws.productId, qty: 2, fulfillment: "send_later" }],
    });

    const row = await sendLaterRowForOrder(orderId);
    expect(row).not.toBeNull();
    expect(row!.fulfillment_status).toBe("pending");
    expect(row!.customer_name).toBe("Aroon");
    expect(row!.customer_phone).toBe("0810000000");
    expect(row!.shipping_address).toBe("123 Sukhumvit, Bangkok");
    expect(row!.shipping_method).toBe("Kerry");
    expect(row!.packed_at).toBeNull();

    // Order + line are tagged send_later.
    const ot = await db.query<{ order_type: string }>(
      `select order_type from public.orders where id = $1`,
      [orderId],
    );
    expect(ot.rows[0].order_type).toBe("send_later");
    const it = await db.query<{ fulfillment_type: string; n: number }>(
      `select fulfillment_type, count(*)::int as n from public.order_items
         where order_id = $1 group by fulfillment_type`,
      [orderId],
    );
    expect(it.rows).toEqual([{ fulfillment_type: "send_later", n: 1 }]);
  });

  it("a take_now-only order creates no queue row", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    expect(await sendLaterRowForOrder(orderId)).toBeNull();
  });

  it("advances pending → packed → shipped, stamping timestamps and tracking (the action's UPDATE)", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      customer_name: "Mali",
      customer_phone: "0820000000",
      shipping_address: "9 Chiang Mai",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "send_later" }],
    });
    const row = await sendLaterRowForOrder(orderId);
    expect(row).not.toBeNull();

    await db.exec(
      `update public.send_later_orders
         set fulfillment_status = 'packed', packed_at = now()
         where id = '${row!.id}'`,
    );
    let after = await sendLaterRowForOrder(orderId);
    expect(after!.fulfillment_status).toBe("packed");
    expect(after!.packed_at).not.toBeNull();

    await db.exec(
      `update public.send_later_orders
         set fulfillment_status = 'shipped', shipped_at = now(),
             tracking_number = 'TH123456789'
         where id = '${row!.id}'`,
    );
    after = await sendLaterRowForOrder(orderId);
    expect(after!.fulfillment_status).toBe("shipped");
    expect(after!.shipped_at).not.toBeNull();
    expect(after!.tracking_number).toBe("TH123456789");
  });
});
