import { describe, it, expect } from "vitest";
import {
  deriveCustomerProfiles,
  findCustomerByPhone,
  phoneKey,
} from "@/lib/demo/customers";
import type { DemoOrder } from "@/lib/demo/sales";

function order(p: Partial<DemoOrder> = {}): DemoOrder {
  return {
    id: p.id ?? "demo-1",
    orderNumber: p.orderNumber ?? "event_001",
    customerName: p.customerName ?? null,
    customerPhone: p.customerPhone ?? null,
    customerEmail: p.customerEmail ?? null,
    orderType: p.orderType ?? "take_now",
    paymentMethod: p.paymentMethod ?? "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: p.totalSatang ?? 0,
    note: null,
    createdAt: p.createdAt ?? new Date().toISOString(),
    items: [],
    ...p,
  };
}

describe("customers/phoneKey", () => {
  it("normalizes leading-0 local format", () => {
    expect(phoneKey("0812345678")).toBe("812345678");
  });

  it("normalizes +66 international format", () => {
    expect(phoneKey("+66812345678")).toBe("812345678");
  });

  it("normalizes 66-prefixed without +", () => {
    expect(phoneKey("66812345678")).toBe("812345678");
  });

  it("strips dashes and spaces", () => {
    expect(phoneKey("081-234-5678")).toBe("812345678");
    expect(phoneKey("081 234 5678")).toBe("812345678");
  });

  it("returns null for too-short input", () => {
    expect(phoneKey("0123")).toBeNull();
    expect(phoneKey("")).toBeNull();
    expect(phoneKey(null)).toBeNull();
    expect(phoneKey(undefined)).toBeNull();
  });

  it("treats different formats as the same key", () => {
    const a = phoneKey("0812345678");
    const b = phoneKey("+66812345678");
    const c = phoneKey("66-812-345-678");
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});

describe("customers/deriveCustomerProfiles", () => {
  it("returns empty map for no orders", () => {
    expect(deriveCustomerProfiles([]).size).toBe(0);
  });

  it("ignores orders with no phone", () => {
    const m = deriveCustomerProfiles([order({ customerPhone: null })]);
    expect(m.size).toBe(0);
  });

  it("creates one profile per unique phone", () => {
    const m = deriveCustomerProfiles([
      order({ id: "1", customerPhone: "0812345678", customerName: "Aim", totalSatang: 50000 }),
      order({ id: "2", customerPhone: "0898765432", customerName: "Visan", totalSatang: 30000 }),
    ]);
    expect(m.size).toBe(2);
  });

  it("merges different formats of the same phone", () => {
    const m = deriveCustomerProfiles([
      order({ id: "1", customerPhone: "0812345678", customerName: "Aim", totalSatang: 50000 }),
      order({ id: "2", customerPhone: "+66812345678", customerName: "Aim", totalSatang: 30000 }),
      order({ id: "3", customerPhone: "081-234-5678", customerName: "Aim", totalSatang: 20000 }),
    ]);
    expect(m.size).toBe(1);
    const [profile] = [...m.values()];
    expect(profile.orderCount).toBe(3);
    expect(profile.totalSatang).toBe(100000);
  });

  it("excludes voided orders", () => {
    const m = deriveCustomerProfiles([
      order({ id: "1", customerPhone: "0812345678", totalSatang: 100, status: "completed" }),
      order({ id: "2", customerPhone: "0812345678", totalSatang: 200, status: "voided" }),
    ]);
    expect(m.size).toBe(1);
    const [p] = [...m.values()];
    expect(p.orderCount).toBe(1);
    expect(p.totalSatang).toBe(100);
  });

  it("uses the latest non-empty fields", () => {
    const earlier = "2026-05-04T08:00:00Z";
    const later = "2026-05-05T08:00:00Z";
    const m = deriveCustomerProfiles([
      order({
        id: "1",
        customerPhone: "0812345678",
        customerName: "Old Name",
        customerEmail: "old@x.com",
        createdAt: earlier,
      }),
      order({
        id: "2",
        customerPhone: "0812345678",
        customerName: "New Name",
        customerEmail: null,
        shippingAddress: "123 Main",
        createdAt: later,
      }),
    ]);
    const [p] = [...m.values()];
    expect(p.name).toBe("New Name");
    expect(p.email).toBe("old@x.com"); // fallback when newer is null
    expect(p.address).toBe("123 Main");
    expect(p.lastSeenAt).toBe(later);
  });
});

describe("customers/findCustomerByPhone", () => {
  const orders: DemoOrder[] = [
    order({ id: "1", customerPhone: "0812345678", customerName: "Aim", totalSatang: 50000 }),
    order({ id: "2", customerPhone: "0812345678", customerName: "Aim", totalSatang: 30000 }),
  ];

  it("finds by exact phone", () => {
    expect(findCustomerByPhone(orders, "0812345678")?.orderCount).toBe(2);
  });

  it("finds across formats", () => {
    expect(findCustomerByPhone(orders, "+66812345678")?.orderCount).toBe(2);
    expect(findCustomerByPhone(orders, "081-234-5678")?.orderCount).toBe(2);
  });

  it("returns null for no match", () => {
    expect(findCustomerByPhone(orders, "0899999999")).toBeNull();
  });

  it("returns null for too-short input", () => {
    expect(findCustomerByPhone(orders, "12")).toBeNull();
  });
});
