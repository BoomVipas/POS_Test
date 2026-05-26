import { describe, it, expect } from "vitest";
import {
  validateSampleMove,
  MAX_SAMPLE_MOVE,
} from "@/lib/inventory/samples";

describe("validateSampleMove", () => {
  it("accepts a positive move within the available cap", () => {
    expect(validateSampleMove(1, 10)).toEqual({ ok: true });
    expect(validateSampleMove(10, 10)).toEqual({ ok: true });
  });

  it("rejects non-integers", () => {
    expect(validateSampleMove(1.5, 10)).toEqual({
      ok: false,
      error: "Quantity must be a whole number.",
    });
  });

  it("rejects zero and negatives", () => {
    expect(validateSampleMove(0, 10)).toEqual({
      ok: false,
      error: "Enter a quantity of at least 1.",
    });
    expect(validateSampleMove(-3, 10)).toEqual({
      ok: false,
      error: "Enter a quantity of at least 1.",
    });
  });

  it("rejects a move larger than what's available, naming the cap", () => {
    expect(validateSampleMove(11, 10)).toEqual({
      ok: false,
      error: "Only 10 available to move.",
    });
    expect(validateSampleMove(1, 0)).toEqual({
      ok: false,
      error: "Only 0 available to move.",
    });
  });

  it("rejects absurdly large quantities before the cap check", () => {
    expect(validateSampleMove(MAX_SAMPLE_MOVE + 1, MAX_SAMPLE_MOVE + 1)).toEqual({
      ok: false,
      error: "That quantity is too large.",
    });
  });
});
