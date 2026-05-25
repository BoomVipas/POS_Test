import { describe, it, expect } from "vitest";
import { validateStockDelta, MAX_STOCK_DELTA } from "@/lib/inventory/restock";

describe("validateStockDelta", () => {
  it("accepts a positive restock", () => {
    expect(validateStockDelta(50, "topped up")).toEqual({ ok: true });
  });
  it("accepts a negative correction", () => {
    expect(validateStockDelta(-3)).toEqual({ ok: true });
  });
  it("rejects zero", () => {
    expect(validateStockDelta(0).ok).toBe(false);
  });
  it("rejects a non-integer", () => {
    expect(validateStockDelta(2.5).ok).toBe(false);
  });
  it("rejects an absurdly large delta", () => {
    expect(validateStockDelta(MAX_STOCK_DELTA + 1).ok).toBe(false);
  });
  it("rejects an over-long reason", () => {
    expect(validateStockDelta(1, "x".repeat(201)).ok).toBe(false);
  });
});
