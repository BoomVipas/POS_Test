// Demo sales (orders) persisted to localStorage.
// Replaced by Supabase `orders` + `order_items` + `payment_records` at DD-65+.

import type {
  FulfillmentType,
  OrderType,
  PaymentMethod,
  SendLaterStatus,
} from "@/lib/database.types";

export const DEMO_SALES_KEY = "pos-for-sell:demo-sales:v1";

export type DemoOrderItem = {
  productId: string;
  sku: string;
  productName: string;
  qty: number;
  unitPriceSatang: number;
  lineTotalSatang: number;
  fulfillmentType: FulfillmentType;
  note?: string;
};

export type DemoOrder = {
  id: string;
  orderNumber: string; // event_001, event_002, ...
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  subtotalSatang: number;
  discountSatang: number;
  shippingFeeSatang: number;
  totalSatang: number;
  note: string | null;
  createdAt: string; // ISO
  items: DemoOrderItem[];

  // Cash tender + change (only meaningful when paymentMethod === "cash").
  cashTenderedSatang?: number;
  changeDueSatang?: number;

  // Send-later (only set for orderType === "send_later" or "mixed").
  sendLaterStatus?: SendLaterStatus;
  trackingNumber?: string | null;
  shippingAddress?: string | null;

  // Order status (defaults to "completed"; void flow flips to "voided").
  status?: "completed" | "voided";
  voidedAt?: string | null;
  voidReason?: string | null;
};

export function readDemoSales(): DemoOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_SALES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoOrder[]) : [];
  } catch {
    return [];
  }
}

export function writeDemoSales(orders: DemoOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_SALES_KEY, JSON.stringify(orders));
  } catch {
    // quota — silently drop
  }
}

export function clearDemoSales(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_SALES_KEY);
}

export function appendDemoSale(order: DemoOrder): void {
  const all = readDemoSales();
  all.push(order);
  writeDemoSales(all);
}

export function updateDemoSale(
  id: string,
  patch: Partial<Omit<DemoOrder, "id" | "items" | "createdAt">>,
): void {
  const all = readDemoSales();
  const next = all.map((o) => (o.id === id ? { ...o, ...patch } : o));
  writeDemoSales(next);
}

/** Pure: derive the next order_number from a given list. Testable. */
export function nextOrderNumberFrom(orders: DemoOrder[]): string {
  let maxSeq = 0;
  for (const o of orders) {
    const m = /^event_(\d+)$/.exec(o.orderNumber);
    if (m) {
      const n = Number(m[1]);
      if (n > maxSeq) maxSeq = n;
    }
  }
  return `event_${String(maxSeq + 1).padStart(3, "0")}`;
}

/** Wrapper that reads from localStorage. */
export function nextOrderNumber(): string {
  return nextOrderNumberFrom(readDemoSales());
}

export function newDemoOrderId(): string {
  return `demo-order-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
