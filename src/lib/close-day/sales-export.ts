import type {
  FulfillmentType,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/database.types";

export type CloseDaySalesOrder = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  order_type: OrderType;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_satang: number;
  discount_satang: number;
  shipping_fee_satang: number;
  total_satang: number;
  status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type CloseDaySalesItem = {
  id: string;
  order_id: string;
  sku: string;
  product_name: string;
  qty: number;
  unit_price_satang: number;
  line_total_satang: number;
  fulfillment_type: FulfillmentType;
  is_sample: boolean;
  note: string | null;
};

export type CloseDaySalesPayment = {
  order_id: string;
  payment_method: Exclude<PaymentMethod, "sample" | "mixed">;
  amount_satang: number;
};

export type CloseDaySalesExportRow = {
  sale_date: string;
  created_at: string;
  order_number: string;
  order_id: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  order_type: OrderType;
  order_payment_method: PaymentMethod;
  payment_methods: string;
  cash_satang: number;
  promptpay_satang: number;
  transfer_satang: number;
  card_satang: number;
  other_satang: number;
  payment_total_satang: number;
  item_id: string;
  sku: string;
  product_name: string;
  qty: number;
  unit_price_satang: number;
  line_total_satang: number;
  fulfillment_type: FulfillmentType | "";
  is_sample: boolean;
  item_note: string;
  subtotal_satang: number;
  discount_satang: number;
  shipping_fee_satang: number;
  order_total_satang: number;
  line_total_baht: string;
  order_total_baht: string;
  order_note: string;
};

type BuildInput = {
  isoDate: string;
  orders: CloseDaySalesOrder[];
  items: CloseDaySalesItem[];
  payments: CloseDaySalesPayment[];
};

const PAYMENT_COLUMNS = [
  "cash",
  "promptpay",
  "transfer",
  "card",
  "other",
] as const;

type PaymentColumn = (typeof PAYMENT_COLUMNS)[number];

type PaymentSummary = Record<`${PaymentColumn}_satang`, number> & {
  payment_methods: string;
  payment_total_satang: number;
};

function emptyPaymentSummary(): PaymentSummary {
  return {
    payment_methods: "",
    cash_satang: 0,
    promptpay_satang: 0,
    transfer_satang: 0,
    card_satang: 0,
    other_satang: 0,
    payment_total_satang: 0,
  };
}

function bahtString(satang: number): string {
  return (satang / 100).toFixed(2);
}

export function buildCloseDaySalesExportRows({
  isoDate,
  orders,
  items,
  payments,
}: BuildInput): CloseDaySalesExportRow[] {
  const itemsByOrder = new Map<string, CloseDaySalesItem[]>();
  for (const item of items) {
    const existing = itemsByOrder.get(item.order_id);
    if (existing) existing.push(item);
    else itemsByOrder.set(item.order_id, [item]);
  }

  const paymentsByOrder = new Map<string, PaymentSummary>();
  for (const payment of payments) {
    const summary =
      paymentsByOrder.get(payment.order_id) ?? emptyPaymentSummary();
    const method = PAYMENT_COLUMNS.includes(payment.payment_method)
      ? payment.payment_method
      : "other";
    summary[`${method}_satang`] += payment.amount_satang;
    summary.payment_total_satang += payment.amount_satang;
    paymentsByOrder.set(payment.order_id, summary);
  }
  for (const [orderId, summary] of paymentsByOrder) {
    summary.payment_methods = PAYMENT_COLUMNS.filter(
      (method) => summary[`${method}_satang`] > 0,
    ).join("+");
    paymentsByOrder.set(orderId, summary);
  }

  return orders.flatMap<CloseDaySalesExportRow>((order) => {
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const paymentSummary = paymentsByOrder.get(order.id) ?? emptyPaymentSummary();
    const base = {
      sale_date: isoDate,
      created_at: order.created_at,
      order_number: order.order_number,
      order_id: order.id,
      order_status: order.status,
      payment_status: order.payment_status,
      customer_name: order.customer_name ?? "",
      customer_phone: order.customer_phone ?? "",
      customer_email: order.customer_email ?? "",
      order_type: order.order_type,
      order_payment_method: order.payment_method,
      ...paymentSummary,
      subtotal_satang: order.subtotal_satang,
      discount_satang: order.discount_satang,
      shipping_fee_satang: order.shipping_fee_satang,
      order_total_satang: order.total_satang,
      order_total_baht: bahtString(order.total_satang),
      order_note: order.note ?? "",
    };

    if (orderItems.length === 0) {
      return [
        {
          ...base,
          item_id: "",
          sku: "",
          product_name: "",
          qty: 0,
          unit_price_satang: 0,
          line_total_satang: 0,
          fulfillment_type: "",
          is_sample: false,
          item_note: "",
          line_total_baht: "0.00",
        },
      ];
    }

    return orderItems.map((item) => ({
      ...base,
      item_id: item.id,
      sku: item.sku,
      product_name: item.product_name,
      qty: item.qty,
      unit_price_satang: item.unit_price_satang,
      line_total_satang: item.line_total_satang,
      fulfillment_type: item.fulfillment_type,
      is_sample: item.is_sample,
      item_note: item.note ?? "",
      line_total_baht: bahtString(item.line_total_satang),
    }));
  });
}
