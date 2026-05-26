import { describe, it, expect } from "vitest";
import {
  computeExpectedCash,
  computeDiscrepancy,
} from "@/lib/close-day/reconcile";

describe("computeExpectedCash", () => {
  it("returns zero for no payments", () => {
    expect(computeExpectedCash([], [])).toEqual({
      expectedCashSatang: 0,
      cashPaymentCount: 0,
    });
  });

  it("sums cash payments only", () => {
    const r = computeExpectedCash(
      [
        { order_id: "a", payment_method: "cash", amount_satang: 10000 },
        { order_id: "b", payment_method: "promptpay", amount_satang: 5000 },
        { order_id: "c", payment_method: "card", amount_satang: 3000 },
        { order_id: "d", payment_method: "cash", amount_satang: 2500 },
      ],
      [
        { id: "a", status: "completed" },
        { id: "b", status: "completed" },
        { id: "c", status: "completed" },
        { id: "d", status: "completed" },
      ],
    );
    expect(r).toEqual({ expectedCashSatang: 12500, cashPaymentCount: 2 });
  });

  it("counts the cash tender of a mixed/split order", () => {
    // one order, two tenders — only the cash portion counts
    const r = computeExpectedCash(
      [
        { order_id: "m", payment_method: "cash", amount_satang: 12000 },
        { order_id: "m", payment_method: "promptpay", amount_satang: 8000 },
      ],
      [{ id: "m", status: "completed" }],
    );
    expect(r).toEqual({ expectedCashSatang: 12000, cashPaymentCount: 1 });
  });

  it("excludes cash from voided orders", () => {
    const r = computeExpectedCash(
      [
        { order_id: "a", payment_method: "cash", amount_satang: 10000 },
        { order_id: "v", payment_method: "cash", amount_satang: 5000 },
      ],
      [
        { id: "a", status: "completed" },
        { id: "v", status: "voided" },
      ],
    );
    expect(r).toEqual({ expectedCashSatang: 10000, cashPaymentCount: 1 });
  });
});

describe("computeDiscrepancy", () => {
  it("is zero when counted matches expected", () => {
    expect(computeDiscrepancy(10000, 10000)).toBe(0);
  });
  it("is positive for a surplus", () => {
    expect(computeDiscrepancy(10500, 10000)).toBe(500);
  });
  it("is negative when short", () => {
    expect(computeDiscrepancy(9800, 10000)).toBe(-200);
  });
});
