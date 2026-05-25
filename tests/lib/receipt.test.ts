// DD-67 — receipt view-model mapper.

import { describe, expect, it } from "vitest";
import {
  toReceiptView,
  type OrderRow,
  type OrderItemRow,
  type PaymentRow,
} from "@/lib/pos/receipt";

const order: OrderRow = {
  order_number: "event_007",
  created_at: "2026-05-25T09:00:00Z",
  payment_method: "cash",
  subtotal_satang: 89000,
  discount_satang: 5000,
  shipping_fee_satang: 0,
  total_satang: 84000,
};

const items: OrderItemRow[] = [
  {
    sku: "HOODIE-001",
    product_name: "Cat Hoodie",
    qty: 1,
    unit_price_satang: 89000,
    line_total_satang: 89000,
    fulfillment_type: "take_now",
    is_sample: false,
    note: "no scarf",
  },
];

const payments: PaymentRow[] = [{ payment_method: "cash", amount_satang: 84000 }];

describe("toReceiptView", () => {
  it("maps snake_case DB rows to the camelCase receipt view", () => {
    const v = toReceiptView(order, items, payments);
    expect(v.orderNumber).toBe("event_007");
    expect(v.paymentMethod).toBe("cash");
    expect(v.subtotalSatang).toBe(89000);
    expect(v.discountSatang).toBe(5000);
    expect(v.totalSatang).toBe(84000);
    expect(v.items).toEqual([
      {
        sku: "HOODIE-001",
        productName: "Cat Hoodie",
        qty: 1,
        unitPriceSatang: 89000,
        lineTotalSatang: 89000,
        fulfillment: "take_now",
        isSample: false,
        note: "no scarf",
      },
    ]);
    expect(v.payments).toEqual([{ method: "cash", amountSatang: 84000 }]);
  });

  it("normalises fulfillment + handles null items/payments and null note", () => {
    const v = toReceiptView(
      order,
      [
        {
          sku: "S1",
          product_name: "Sample",
          qty: 2,
          unit_price_satang: 0,
          line_total_satang: 0,
          fulfillment_type: "weird-value",
          is_sample: true,
          note: null,
        },
      ],
      null,
    );
    expect(v.items[0].fulfillment).toBe("take_now"); // anything not send_later → take_now
    expect(v.items[0].isSample).toBe(true);
    expect(v.items[0].note).toBeNull();
    expect(v.payments).toEqual([]); // null payments → empty
  });

  it("keeps send_later fulfillment", () => {
    const v = toReceiptView(
      order,
      [{ ...items[0], fulfillment_type: "send_later" }],
      [],
    );
    expect(v.items[0].fulfillment).toBe("send_later");
  });
});
