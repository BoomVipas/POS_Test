// Wave 41a — cap discount at subtotal+shipping (finding L1).
//
// Before this fix the discount input had no upper bound: typing 99999 on a
// 100-baht cart would saturate the total to 0 silently and persist a 9.999M-
// satang discount value on the order. That breaks dashboard/margin reports
// and confuses cashiers ("why does this receipt say 0 THB?").
//
// `capDiscount(typedSatang, maxSatang)` is the boundary clamp: pure function
// so it's testable without React, and the result includes a `capped` flag so
// the UI can render an inline hint.

import { describe, expect, it } from "vitest";
import { capDiscount } from "@/lib/pos/calc";

describe("capDiscount (Wave 41a, finding L1)", () => {
  it("returns the typed value unchanged when below the cap", () => {
    expect(capDiscount(50, 100)).toEqual({ satang: 50, capped: false });
  });

  it("returns the typed value unchanged when exactly at the cap", () => {
    expect(capDiscount(100, 100)).toEqual({ satang: 100, capped: false });
  });

  it("clamps to the cap and flags `capped: true` when typed exceeds cap", () => {
    expect(capDiscount(150, 100)).toEqual({ satang: 100, capped: true });
  });

  it("clamps a wildly-large typed value (the bug repro: 99999 baht on a 100-satang cart)", () => {
    // 99999 baht = 9_999_900 satang; cap is the 100-satang cart total.
    expect(capDiscount(9_999_900, 100)).toEqual({ satang: 100, capped: true });
  });

  it("clamps negative typed values to 0 (not 'capped' — it's the lower bound)", () => {
    expect(capDiscount(-50, 100)).toEqual({ satang: 0, capped: false });
  });

  it("returns 0 with capped:false when the max is 0 (empty cart)", () => {
    // No cart total means no discount is meaningful; emit 0 quietly.
    expect(capDiscount(500, 0)).toEqual({ satang: 0, capped: false });
    expect(capDiscount(0, 0)).toEqual({ satang: 0, capped: false });
  });

  it("returns 0 with capped:false when typed is 0", () => {
    expect(capDiscount(0, 100)).toEqual({ satang: 0, capped: false });
  });
});
