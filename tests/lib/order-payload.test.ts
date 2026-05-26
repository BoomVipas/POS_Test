// DD-65 — cart → create_order payload builder.

import { describe, expect, it } from "vitest";
import {
  buildCreateOrderPayload,
  type BuildPayloadInput,
} from "@/lib/pos/order-payload";

const base: BuildPayloadInput = {
  workspaceId: "ws-1",
  eventId: "ev-1",
  lines: [
    { productId: "p1", qty: 2, fulfillment: "take_now" },
    { productId: "p2", qty: 1, fulfillment: "take_now", note: "  no scarf  " },
  ],
  paymentMethod: "cash",
  splits: [],
  discountSatang: 5000,
  customer: {},
};

describe("buildCreateOrderPayload", () => {
  it("maps lines → items and forwards the single-tender method + discount", () => {
    const p = buildCreateOrderPayload(base);
    expect(p.workspace_id).toBe("ws-1");
    expect(p.event_id).toBe("ev-1");
    expect(p.payment_method).toBe("cash");
    expect(p.discount_satang).toBe(5000);
    expect(p.items).toEqual([
      { product_id: "p1", qty: 2, fulfillment: "take_now" },
      { product_id: "p2", qty: 1, fulfillment: "take_now", note: "no scarf" },
    ]);
    expect(p.payments).toBeUndefined();
  });

  it("uses 'mixed' + a payments array when splits are present", () => {
    const p = buildCreateOrderPayload({
      ...base,
      paymentMethod: "cash",
      splits: [
        { method: "cash", amountSatang: 3000 },
        { method: "promptpay", amountSatang: 7000 },
      ],
    });
    expect(p.payment_method).toBe("mixed");
    expect(p.payments).toEqual([
      { method: "cash", amount_satang: 3000 },
      { method: "promptpay", amount_satang: 7000 },
    ]);
  });

  it("includes shipping_address only when a line is send_later and an address is given", () => {
    const withSendLater = buildCreateOrderPayload({
      ...base,
      lines: [{ productId: "p1", qty: 1, fulfillment: "send_later" }],
      customer: { name: "Aim", phone: "0812345678", address: "123 Soi Cat" },
    });
    expect(withSendLater.shipping_address).toBe("123 Soi Cat");
    expect(withSendLater.customer_name).toBe("Aim");
    expect(withSendLater.customer_phone).toBe("0812345678");

    // take_now with an address → no shipping_address forwarded.
    const takeNow = buildCreateOrderPayload({
      ...base,
      customer: { address: "123 Soi Cat" },
    });
    expect(takeNow.shipping_address).toBeUndefined();
  });

  it("omits blank customer fields and clamps a negative discount to 0", () => {
    const p = buildCreateOrderPayload({
      ...base,
      discountSatang: -100,
      customer: { name: "   ", email: "" },
    });
    expect(p.customer_name).toBeUndefined();
    expect(p.customer_email).toBeUndefined();
    expect(p.discount_satang).toBe(0);
  });

  it("forwards client_request_id only when provided (idempotency key)", () => {
    expect(buildCreateOrderPayload(base).client_request_id).toBeUndefined();
    const withKey = buildCreateOrderPayload({
      ...base,
      clientRequestId: "req-abc",
    });
    expect(withKey.client_request_id).toBe("req-abc");
  });
});
