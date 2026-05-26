// DD-92 — close_day persistence, end-to-end in pglite. Proves the RPC
// recomputes expected cash from the REAL payment_records (cash, non-voided,
// that Bangkok day), stores the reconciliation record with the right
// discrepancy, writes an audit row, and is role-gated. The read-only display
// computation is unit-tested in tests/lib/close-day-reconcile.

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
  db = await bootDb(["create_order.sql", "close_day.sql"]);
});

afterAll(async () => {
  await db.close();
});

async function bangkokToday(): Promise<string> {
  const r = await db.query<{ d: string }>(
    `select (now() at time zone 'Asia/Bangkok')::date::text as d`,
  );
  return r.rows[0].d;
}

type CloseRow = {
  id: string;
  expected: number;
  counted: number;
  discrepancy: number;
};

async function closeDay(
  ws: SeededWorkspace,
  isoDate: string,
  counted: number,
  reason: string | null = null,
): Promise<CloseRow> {
  const r = await db.query<CloseRow>(
    `select id,
            expected_cash_satang as expected,
            counted_cash_satang as counted,
            discrepancy_satang as discrepancy
       from public.close_day($1, $2, $3, $4)`,
    [ws.workspaceId, isoDate, counted, reason],
  );
  return r.rows[0];
}

describe("close_day (DD-92)", () => {
  it("recomputes expected cash from real payments and writes record + audit", async () => {
    const ws = await seedWorkspace(db);
    // cash 10000
    await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    // mixed 20000: cash 12000 + promptpay 8000 (only the 12000 cash counts)
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
    // voided cash 10000 → excluded
    const voidId = await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    await db.exec(`update public.orders set status='voided' where id='${voidId}'`);

    const today = await bangkokToday();
    const rec = await closeDay(ws, today, 22000);
    expect(rec.expected).toBe(22000); // 10000 + 12000; voided excluded
    expect(rec.counted).toBe(22000);
    expect(rec.discrepancy).toBe(0);

    const audit = await db.query<{ n: number }>(
      `select count(*)::int as n from public.audit_logs
         where workspace_id = $1 and action = 'close_day' and target_id = $2`,
      [ws.workspaceId, rec.id],
    );
    expect(audit.rows[0].n).toBe(1);
  });

  it("records a short drawer as a negative discrepancy", async () => {
    const ws = await seedWorkspace(db);
    await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const today = await bangkokToday();
    const rec = await closeDay(ws, today, 9500, "gave wrong change"); // expected 10000 → short 500
    expect(rec.expected).toBe(10000);
    expect(rec.discrepancy).toBe(-500);
  });

  it("requires a reason when the (recomputed) discrepancy is non-zero", async () => {
    const ws = await seedWorkspace(db);
    await createOrder(db, {
      workspace_id: ws.workspaceId,
      event_id: ws.eventId,
      payment_method: "cash",
      items: [{ product_id: ws.productId, qty: 1, fulfillment: "take_now" }],
    });
    const today = await bangkokToday();
    // counted 9000 vs expected 10000 → −1000, no reason → reject
    await expect(closeDay(ws, today, 9000)).rejects.toThrow(/reason/i);
    // with a reason → accepted
    const ok = await closeDay(ws, today, 9000, "miscount, recounted later");
    expect(ok.discrepancy).toBe(-1000);
  });

  it("rejects a member without an allowed role", async () => {
    const ws = await seedWorkspace(db);
    const u = await db.query<{ id: string }>(
      `insert into auth.users default values returning id`,
    );
    const uid = u.rows[0].id;
    await db.exec(
      `insert into public.workspace_members(workspace_id, user_id, role)
         values ('${ws.workspaceId}', '${uid}', 'stock_staff')`,
    );
    await db.exec(`set test.user_id = '${uid}'`);
    const today = await bangkokToday();
    await expect(closeDay(ws, today, 1000)).rejects.toThrow(/forbidden/i);
    await db.exec(`set test.user_id = '${ws.userId}'`); // restore
  });
});
