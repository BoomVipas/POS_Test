// Wave 44 — close-day cash reconciliation, end-to-end against real create_order
// output in pglite. Proves computeExpectedCash sums the right cash from the rows
// the live page reads: a plain cash order, the cash tender of a mixed order, and
// NOT a voided order's cash. The filtering/exclusion logic itself is unit-tested
// in tests/lib/close-day-reconcile.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  bootDb,
  createOrder,
  seedWorkspace,
  type SeededWorkspace,
} from "./helpers/pglite";
import { computeExpectedCash } from "@/lib/close-day/reconcile";

let db: PGlite;

beforeAll(async () => {
  db = await bootDb(["create_order.sql"]);
});

afterAll(async () => {
  await db.close();
});

async function readRows(ws: SeededWorkspace) {
  const orders = (
    await db.query<{ id: string; status: string }>(
      `select id, status from public.orders where workspace_id = $1`,
      [ws.workspaceId],
    )
  ).rows;
  const payments = (
    await db.query<{
      order_id: string;
      payment_method: string;
      amount_satang: number;
    }>(
      `select order_id, payment_method, amount_satang
         from public.payment_records where workspace_id = $1`,
      [ws.workspaceId],
    )
  ).rows;
  return { orders, payments };
}

describe("close-day reconciliation (Wave 44)", () => {
  it("expected cash = cash orders + cash tender of mixed, excluding voided", async () => {
    const ws = await seedWorkspace(db);

    // A — plain cash, 1 × 10000
    await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });

    // B — mixed, 2 × 10000 = 20000, split cash 12000 + promptpay 8000
    await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "mixed",
      payments: [
        { method: "cash", amount_satang: 12000 },
        { method: "promptpay", amount_satang: 8000 },
      ],
      items: [{ product_id: ws.productId, qty: 2, fulfillment: "take_now" }],
    });

    // C — cash 10000, then voided → must be excluded
    const voidId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    await db.exec(
      `update public.orders set status = 'voided' where id = '${voidId}'`,
    );

    const { orders, payments } = await readRows(ws);
    const r = computeExpectedCash(payments, orders);

    // 10000 (A) + 12000 (B cash) = 22000; C's 10000 excluded (voided).
    expect(r.expectedCashSatang).toBe(22000);
    expect(r.cashPaymentCount).toBe(2);
  });

  it("counts a voided order's cash when the void is reversed (control)", async () => {
    // Fresh workspace: one cash order, NOT voided → counted.
    const ws = await seedWorkspace(db);
    await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const { orders, payments } = await readRows(ws);
    expect(computeExpectedCash(payments, orders)).toEqual({
      expectedCashSatang: 10000,
      cashPaymentCount: 1,
    });
  });
});
