// Wave 41g — create_order payment guards (findings D1, D2).
//
// D1: payment_method=mixed with empty/missing payments must be rejected. Today
//     the function falls through both payment branches and writes ZERO payment
//     records for a completed, "paid" order.
// D2: when a payments[] array is supplied, its sum must equal the order total.
//     Today the amounts are inserted unchecked, so payments can silently
//     under- or over-shoot the total.
//
// Repro runs the real plpgsql in pglite (see helpers/pglite.ts).

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

async function paymentRecordCount(orderId: string): Promise<number> {
  const r = await db.query<{ n: number }>(
    `select count(*)::int as n from public.payment_records where order_id = $1`,
    [orderId],
  );
  return r.rows[0].n;
}

describe("create_order payment guards (Wave 41g, D1/D2)", () => {
  let ws: SeededWorkspace;

  beforeAll(async () => {
    ws = await seedWorkspace(db);
  });

  it("D1: rejects payment_method=mixed with missing payments", async () => {
    await expect(
      createOrder(db, {
        workspace_id: ws.workspaceId,
        event_id: ws.eventId,
        payment_method: "mixed",
        items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
      }),
    ).rejects.toThrow(/mixed/i);
  });

  it("D1: rejects payment_method=mixed with an empty payments array", async () => {
    await expect(
      createOrder(db, {
        workspace_id: ws.workspaceId,
        event_id: ws.eventId,
        payment_method: "mixed",
        payments: [],
        items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
      }),
    ).rejects.toThrow(/mixed/i);
  });

  it("D2: rejects a payments array whose sum is short of the total, naming the off-by", async () => {
    // 1 x 10000 satang, no discount/shipping => total 10000. Pay 9000 => off by 1000.
    await expect(
      createOrder(db, {
        workspace_id: ws.workspaceId,
        event_id: ws.eventId,
        payment_method: "mixed",
        payments: [{ method: "cash", amount_satang: 9000 }],
        items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
      }),
    ).rejects.toThrow(/1000/);
  });

  it("D2: rejects a payments array whose sum overshoots the total", async () => {
    await expect(
      createOrder(db, {
        workspace_id: ws.workspaceId,
        event_id: ws.eventId,
        payment_method: "mixed",
        payments: [{ method: "cash", amount_satang: 12000 }],
        items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
      }),
    ).rejects.toThrow(/2000/);
  });

  it("accepts mixed when payments sum exactly to the total", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "mixed",
      payments: [
        { method: "cash", amount_satang: 4000 },
        { method: "promptpay", amount_satang: 6000 },
      ],
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    expect(await paymentRecordCount(orderId)).toBe(2);
  });

  it("still auto-creates one payment record for a plain cash order", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    expect(await paymentRecordCount(orderId)).toBe(1);
  });
});

describe("create_order discount cap (Wave 41h, D3)", () => {
  let ws: SeededWorkspace;

  beforeAll(async () => {
    ws = await seedWorkspace(db);
  });

  async function orderRow(orderId: string) {
    const r = await db.query<{
      discount_satang: number;
      total_satang: number;
      subtotal_satang: number;
    }>(
      `select discount_satang, total_satang, subtotal_satang
         from public.orders where id = $1`,
      [orderId],
    );
    return r.rows[0];
  }

  it("caps an absurd discount at subtotal+shipping and zeroes the total", async () => {
    // 1 x 10000 satang, no shipping => max discount is 10000.
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      discount_satang: 999_000_000_000_000,
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const row = await orderRow(orderId);
    expect(row.subtotal_satang).toBe(10000);
    expect(row.discount_satang).toBe(10000); // capped, not the absurd value
    expect(row.total_satang).toBe(0);
  });

  it("records an audit breadcrumb noting the discount was capped", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      discount_satang: 999_000_000_000_000,
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const r = await db.query<{ new_value: Record<string, unknown> }>(
      `select new_value from public.audit_logs
         where target_id = $1 and action = 'create_order'`,
      [orderId],
    );
    expect(r.rows[0].new_value.discount_capped).toBe(true);
  });

  it("leaves a within-range discount untouched", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      discount_satang: 3000,
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const row = await orderRow(orderId);
    expect(row.discount_satang).toBe(3000);
    expect(row.total_satang).toBe(7000);
  });
});

describe("create_order payment_status (Wave 41i, D4)", () => {
  // Characterization guard for the dead-CASE removal: both branches of the old
  // `case when method='sample' then 'paid' else 'paid' end` returned 'paid', so
  // collapsing it to the literal must not change observable behaviour.
  let ws: SeededWorkspace;

  beforeAll(async () => {
    ws = await seedWorkspace(db);
  });

  async function paymentStatus(orderId: string): Promise<string> {
    const r = await db.query<{ payment_status: string }>(
      `select payment_status from public.orders where id = $1`,
      [orderId],
    );
    return r.rows[0].payment_status;
  }

  it("marks a plain cash order 'paid'", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    expect(await paymentStatus(orderId)).toBe("paid");
  });

  it("marks a sample order 'paid'", async () => {
    const orderId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "sample",
      items: [
        {
          product_id: ws.productId,
          qty: 1,
          fulfillment: "take_now",
          is_sample: true,
        },
      ],
    });
    expect(await paymentStatus(orderId)).toBe("paid");
  });
});
