import { describe, it, expect } from "vitest";
import { reducer, initial } from "@/lib/pos/cart-store";

// Fresh state with one take-now line.
const withLine = (productId = "p1", qty = 1) =>
  reducer(initial, { type: "ADD", productId, qty });

describe("cart reducer — lines", () => {
  it("ADD inserts a new take_now line with qty 1 by default", () => {
    const s = reducer(initial, { type: "ADD", productId: "p1" });
    expect(s.lines).toEqual([
      { productId: "p1", qty: 1, fulfillment: "take_now" },
    ]);
  });

  it("ADD respects qty and fulfillment", () => {
    const s = reducer(initial, {
      type: "ADD",
      productId: "p1",
      qty: 3,
      fulfillment: "send_later",
    });
    expect(s.lines[0]).toEqual({
      productId: "p1",
      qty: 3,
      fulfillment: "send_later",
    });
  });

  it("ADD on an existing product increments qty (no duplicate line)", () => {
    let s = withLine("p1", 2);
    s = reducer(s, { type: "ADD", productId: "p1", qty: 3 });
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0].qty).toBe(5);
  });

  it("SET_QTY updates quantity", () => {
    const s = reducer(withLine("p1", 1), {
      type: "SET_QTY",
      productId: "p1",
      qty: 7,
    });
    expect(s.lines[0].qty).toBe(7);
  });

  it("SET_QTY to 0 or negative removes the line", () => {
    expect(
      reducer(withLine("p1", 4), { type: "SET_QTY", productId: "p1", qty: 0 })
        .lines,
    ).toHaveLength(0);
    expect(
      reducer(withLine("p2", 4), { type: "SET_QTY", productId: "p2", qty: -1 })
        .lines,
    ).toHaveLength(0);
  });

  it("REMOVE drops only the named line", () => {
    let s = withLine("p1");
    s = reducer(s, { type: "ADD", productId: "p2" });
    s = reducer(s, { type: "REMOVE", productId: "p1" });
    expect(s.lines.map((l) => l.productId)).toEqual(["p2"]);
  });

  it("SET_FULFILLMENT toggles the line's fulfillment", () => {
    const s = reducer(withLine("p1"), {
      type: "SET_FULFILLMENT",
      productId: "p1",
      fulfillment: "send_later",
    });
    expect(s.lines[0].fulfillment).toBe("send_later");
  });

  it("SET_LINE_NOTE sets a note; blank/whitespace clears it", () => {
    let s = reducer(withLine("p1"), {
      type: "SET_LINE_NOTE",
      productId: "p1",
      note: "gift wrap",
    });
    expect(s.lines[0].note).toBe("gift wrap");
    s = reducer(s, { type: "SET_LINE_NOTE", productId: "p1", note: "   " });
    expect(s.lines[0].note).toBeUndefined();
  });

  it("CLEAR resets to the initial state", () => {
    let s = withLine("p1", 2);
    s = reducer(s, { type: "SET_DISCOUNT", satang: 500 });
    expect(reducer(s, { type: "CLEAR" })).toEqual(initial);
  });
});

describe("cart reducer — payment", () => {
  it("SET_PAYMENT_METHOD sets the method", () => {
    expect(
      reducer(initial, { type: "SET_PAYMENT_METHOD", method: "promptpay" })
        .paymentMethod,
    ).toBe("promptpay");
  });

  it("switching away from cash resets cash tendered", () => {
    let s = reducer(initial, { type: "SET_PAYMENT_METHOD", method: "cash" });
    s = reducer(s, { type: "SET_CASH_TENDERED", satang: 10000 });
    expect(s.cashTenderedSatang).toBe(10000);
    s = reducer(s, { type: "SET_PAYMENT_METHOD", method: "card" });
    expect(s.cashTenderedSatang).toBe(0);
  });

  it("SET_DISCOUNT clamps negatives to 0", () => {
    expect(
      reducer(initial, { type: "SET_DISCOUNT", satang: 500 }).discountSatang,
    ).toBe(500);
    expect(
      reducer(initial, { type: "SET_DISCOUNT", satang: -50 }).discountSatang,
    ).toBe(0);
  });

  it("SET_CASH_TENDERED clamps negatives to 0", () => {
    expect(
      reducer(initial, { type: "SET_CASH_TENDERED", satang: -5 })
        .cashTenderedSatang,
    ).toBe(0);
  });
});

describe("cart reducer — splits", () => {
  it("ADD_SPLIT appends and clears the single payment method", () => {
    let s = reducer(initial, { type: "SET_PAYMENT_METHOD", method: "cash" });
    s = reducer(s, {
      type: "ADD_SPLIT",
      split: { method: "cash", amountSatang: 5000 },
    });
    expect(s.splits).toHaveLength(1);
    expect(s.paymentMethod).toBeNull();
  });

  it("UPDATE_SPLIT patches the split at index", () => {
    let s = reducer(initial, {
      type: "ADD_SPLIT",
      split: { method: "cash", amountSatang: 5000 },
    });
    s = reducer(s, {
      type: "UPDATE_SPLIT",
      index: 0,
      patch: { amountSatang: 7500 },
    });
    expect(s.splits[0]).toEqual({ method: "cash", amountSatang: 7500 });
  });

  it("REMOVE_SPLIT removes by index; CLEAR_SPLITS empties", () => {
    let s = reducer(initial, {
      type: "ADD_SPLIT",
      split: { method: "cash", amountSatang: 1000 },
    });
    s = reducer(s, {
      type: "ADD_SPLIT",
      split: { method: "card", amountSatang: 2000 },
    });
    s = reducer(s, { type: "REMOVE_SPLIT", index: 0 });
    expect(s.splits).toEqual([{ method: "card", amountSatang: 2000 }]);
    expect(reducer(s, { type: "CLEAR_SPLITS" }).splits).toEqual([]);
  });
});

describe("cart reducer — customer, source, immutability", () => {
  it("SET_CUSTOMER merges the patch", () => {
    let s = reducer(initial, { type: "SET_CUSTOMER", patch: { name: "Mali" } });
    s = reducer(s, { type: "SET_CUSTOMER", patch: { phone: "0812345678" } });
    expect(s.customer).toEqual({
      name: "Mali",
      phone: "0812345678",
      email: "",
      address: "",
    });
  });

  it("SET_SOURCE sets the acquisition channel", () => {
    expect(
      reducer(initial, { type: "SET_SOURCE", source: "qr_menu" }).source,
    ).toBe("qr_menu");
  });

  it("does not mutate the input state", () => {
    const before = withLine("p1", 1);
    const snapshot = JSON.parse(JSON.stringify(before));
    reducer(before, { type: "ADD", productId: "p1" });
    reducer(before, { type: "SET_DISCOUNT", satang: 999 });
    expect(before).toEqual(snapshot);
  });
});
