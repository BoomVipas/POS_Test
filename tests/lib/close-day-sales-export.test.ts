import { describe, expect, it } from "vitest";
import {
  buildCloseDaySalesExportRows,
  type CloseDaySalesItem,
  type CloseDaySalesOrder,
  type CloseDaySalesPayment,
} from "@/lib/close-day/sales-export";

const order: CloseDaySalesOrder = {
  id: "order-1",
  order_number: "ORD-0001",
  customer_name: "May",
  customer_phone: "0812345678",
  customer_email: null,
  order_type: "mixed",
  payment_method: "mixed",
  payment_status: "paid",
  subtotal_satang: 15000,
  discount_satang: 1000,
  shipping_fee_satang: 500,
  total_satang: 14500,
  status: "completed",
  note: "accounting note",
  created_at: "2026-05-27T03:15:00.000Z",
};

describe("buildCloseDaySalesExportRows", () => {
  it("exports one accounting row per sold item line with payment columns", () => {
    const items: CloseDaySalesItem[] = [
      {
        id: "item-1",
        order_id: "order-1",
        sku: "MOCHI-BOX",
        product_name: "Mochi Box",
        qty: 2,
        unit_price_satang: 5000,
        line_total_satang: 10000,
        fulfillment_type: "take_now",
        is_sample: false,
        note: null,
      },
      {
        id: "item-2",
        order_id: "order-1",
        sku: "DELIVERY",
        product_name: "Delivery",
        qty: 1,
        unit_price_satang: 5000,
        line_total_satang: 5000,
        fulfillment_type: "send_later",
        is_sample: false,
        note: "ship tomorrow",
      },
    ];
    const payments: CloseDaySalesPayment[] = [
      { order_id: "order-1", payment_method: "cash", amount_satang: 4500 },
      {
        order_id: "order-1",
        payment_method: "promptpay",
        amount_satang: 10000,
      },
    ];

    const rows = buildCloseDaySalesExportRows({
      isoDate: "2026-05-27",
      orders: [order],
      items,
      payments,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      sale_date: "2026-05-27",
      order_number: "ORD-0001",
      payment_methods: "cash+promptpay",
      cash_satang: 4500,
      promptpay_satang: 10000,
      payment_total_satang: 14500,
      sku: "MOCHI-BOX",
      qty: 2,
      line_total_satang: 10000,
      line_total_baht: "100.00",
      order_total_baht: "145.00",
    });
    expect(rows[1]).toMatchObject({
      sku: "DELIVERY",
      fulfillment_type: "send_later",
      item_note: "ship tomorrow",
      order_total_satang: 14500,
    });
  });

  it("keeps an order visible even when item rows are missing", () => {
    const rows = buildCloseDaySalesExportRows({
      isoDate: "2026-05-27",
      orders: [{ ...order, id: "order-without-items" }],
      items: [],
      payments: [],
    });

    expect(rows).toEqual([
      expect.objectContaining({
        order_id: "order-without-items",
        product_name: "",
        qty: 0,
        payment_total_satang: 0,
      }),
    ]);
  });
});
