import { describe, it, expect } from "vitest";
import {
  splitsTotal,
  splitsRemaining,
  validateSplits,
  type PaymentSplit,
} from "@/lib/pos/splits";

const split = (method: PaymentSplit["method"], amountSatang: number): PaymentSplit => ({
  method,
  amountSatang,
});

describe("splits/splitsTotal", () => {
  it("sums positive amounts", () => {
    expect(splitsTotal([split("cash", 50000), split("promptpay", 30000)])).toBe(80000);
  });

  it("ignores negative amounts (clamps to 0)", () => {
    expect(splitsTotal([split("cash", -1000), split("promptpay", 30000)])).toBe(30000);
  });

  it("returns 0 for empty array", () => {
    expect(splitsTotal([])).toBe(0);
  });
});

describe("splits/splitsRemaining", () => {
  it("returns positive when under-paid", () => {
    expect(splitsRemaining([split("cash", 30000)], 50000)).toBe(20000);
  });

  it("returns 0 when paid exactly", () => {
    expect(splitsRemaining([split("cash", 50000)], 50000)).toBe(0);
  });

  it("returns negative when over-paid", () => {
    expect(splitsRemaining([split("cash", 60000)], 50000)).toBe(-10000);
  });
});

describe("splits/validateSplits", () => {
  it("rejects empty splits", () => {
    expect(validateSplits([], 50000)).toEqual({ ok: false, reason: "empty", offBy: 50000 });
  });

  it("rejects short payment", () => {
    expect(
      validateSplits([split("cash", 30000)], 50000),
    ).toEqual({ ok: false, reason: "short", offBy: 20000 });
  });

  it("rejects over payment", () => {
    expect(
      validateSplits([split("cash", 60000)], 50000),
    ).toEqual({ ok: false, reason: "over", offBy: 10000 });
  });

  it("accepts exact payment", () => {
    expect(
      validateSplits([split("cash", 30000), split("promptpay", 20000)], 50000),
    ).toEqual({ ok: true });
  });

  it("accepts multiple methods that sum exactly", () => {
    expect(
      validateSplits(
        [split("cash", 10000), split("promptpay", 20000), split("card", 20000)],
        50000,
      ),
    ).toEqual({ ok: true });
  });

  // Wave 41c — finding L6. splitsTotal silently clamps negatives to 0 in the
  // sum, so a split array like [cash 100, cash -50] would look like 100 (and
  // could even pass validation if the cart total were also 100). UI shows the
  // -50 row though, so what the cashier reads contradicts what gets recorded.
  // validateSplits now rejects any negative amount before the empty/short/over
  // checks — the negative is a corruption signal, not a payment mode.
  describe("rejects negative line amounts (defense-in-depth)", () => {
    it("flags a single negative line with reason='negative'", () => {
      expect(
        validateSplits([split("cash", -50)], 100),
      ).toEqual({ ok: false, reason: "negative", offBy: 50 });
    });

    it("flags a negative line even when the rest sum to total (the audit repro)", () => {
      // 100 + (-50) silently looks like 50 via splitsTotal, but the array is
      // corrupt: surface it before the short/over math runs.
      expect(
        validateSplits([split("cash", 10000), split("promptpay", -5000)], 5000),
      ).toEqual({ ok: false, reason: "negative", offBy: 5000 });
    });

    it("offBy reports the absolute value of the most-negative line", () => {
      // If multiple negatives, the user should see the worst offender so they
      // can locate and fix it.
      expect(
        validateSplits(
          [split("cash", 100), split("promptpay", -200), split("card", -50)],
          100,
        ),
      ).toEqual({ ok: false, reason: "negative", offBy: 200 });
    });

    it("a zero amount is not negative", () => {
      // Zero is degenerate but not a corruption signal — the regular short/empty
      // path handles it.
      expect(
        validateSplits([split("cash", 0)], 100),
      ).toEqual({ ok: false, reason: "short", offBy: 100 });
    });
  });
});
