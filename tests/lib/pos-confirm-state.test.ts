import { describe, it, expect } from "vitest";
import {
  resolveSubmit,
  shouldClearCart,
  NETWORK_ERROR_MESSAGE,
} from "@/lib/pos/confirm-state";

describe("resolveSubmit", () => {
  it("maps a successful result to success + orderId", () => {
    const r = resolveSubmit({ ok: true, orderId: "ord_123" });
    expect(r).toEqual({ kind: "success", orderId: "ord_123" });
  });

  it("maps an RPC-rejected result to a failure carrying the message", () => {
    const r = resolveSubmit({ ok: false, error: "Not enough stock." });
    expect(r).toEqual({ kind: "failure", message: "Not enough stock." });
  });

  it("maps a thrown/unreachable call (null) to the retryable network message", () => {
    const r = resolveSubmit(null);
    expect(r).toEqual({ kind: "failure", message: NETWORK_ERROR_MESSAGE });
  });
});

describe("shouldClearCart — the cart is only ever cleared on success", () => {
  it("clears on success", () => {
    expect(shouldClearCart({ kind: "success", orderId: "x" })).toBe(true);
  });

  it("never clears on an RPC failure", () => {
    expect(
      shouldClearCart(resolveSubmit({ ok: false, error: "anything" })),
    ).toBe(false);
  });

  it("never clears on a network/transport failure", () => {
    expect(shouldClearCart(resolveSubmit(null))).toBe(false);
  });
});
