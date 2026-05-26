import { describe, it, expect } from "vitest";
import {
  validateVoidReason,
  MIN_VOID_REASON,
  MAX_VOID_REASON,
} from "@/lib/orders/void";

describe("validateVoidReason", () => {
  it("accepts a reason of at least the minimum length", () => {
    expect(validateVoidReason("wrong item rung up")).toEqual({ ok: true });
    expect(validateVoidReason("x".repeat(MIN_VOID_REASON))).toEqual({ ok: true });
  });

  it("rejects an empty or too-short reason (after trim)", () => {
    expect(validateVoidReason("")).toEqual({
      ok: false,
      error: `Reason must be at least ${MIN_VOID_REASON} characters.`,
    });
    expect(validateVoidReason("  a ")).toEqual({
      ok: false,
      error: `Reason must be at least ${MIN_VOID_REASON} characters.`,
    });
  });

  it("rejects an over-long reason", () => {
    expect(validateVoidReason("x".repeat(MAX_VOID_REASON + 1))).toEqual({
      ok: false,
      error: `Reason must be ${MAX_VOID_REASON} characters or fewer.`,
    });
  });
});
