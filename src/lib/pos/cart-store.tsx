"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { CartLine, PaymentMethod } from "./types";

type State = {
  lines: CartLine[];
  paymentMethod: PaymentMethod | null;
  discountSatang: number;
  /** Cash tendered when paymentMethod === "cash". 0 means not entered yet. */
  cashTenderedSatang: number;
  customer: { name: string; phone: string; email: string; address: string };
};

type Action =
  | {
      type: "ADD";
      productId: string;
      qty?: number;
      fulfillment?: CartLine["fulfillment"];
    }
  | { type: "SET_QTY"; productId: string; qty: number }
  | { type: "REMOVE"; productId: string }
  | {
      type: "SET_FULFILLMENT";
      productId: string;
      fulfillment: CartLine["fulfillment"];
    }
  | { type: "SET_LINE_NOTE"; productId: string; note: string }
  | { type: "CLEAR" }
  | { type: "SET_PAYMENT_METHOD"; method: PaymentMethod | null }
  | { type: "SET_DISCOUNT"; satang: number }
  | { type: "SET_CASH_TENDERED"; satang: number }
  | { type: "SET_CUSTOMER"; patch: Partial<State["customer"]> };

const initial: State = {
  lines: [],
  paymentMethod: null,
  discountSatang: 0,
  cashTenderedSatang: 0,
  customer: { name: "", phone: "", email: "", address: "" },
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "ADD": {
      const existing = s.lines.find((l) => l.productId === a.productId);
      const incQty = a.qty ?? 1;
      if (existing) {
        return {
          ...s,
          lines: s.lines.map((l) =>
            l.productId === a.productId ? { ...l, qty: l.qty + incQty } : l,
          ),
        };
      }
      return {
        ...s,
        lines: [
          ...s.lines,
          {
            productId: a.productId,
            qty: incQty,
            fulfillment: a.fulfillment ?? "take_now",
          },
        ],
      };
    }
    case "SET_QTY":
      return {
        ...s,
        lines:
          a.qty <= 0
            ? s.lines.filter((l) => l.productId !== a.productId)
            : s.lines.map((l) =>
                l.productId === a.productId ? { ...l, qty: a.qty } : l,
              ),
      };
    case "REMOVE":
      return {
        ...s,
        lines: s.lines.filter((l) => l.productId !== a.productId),
      };
    case "SET_FULFILLMENT":
      return {
        ...s,
        lines: s.lines.map((l) =>
          l.productId === a.productId
            ? { ...l, fulfillment: a.fulfillment }
            : l,
        ),
      };
    case "SET_LINE_NOTE":
      return {
        ...s,
        lines: s.lines.map((l) =>
          l.productId === a.productId
            ? { ...l, note: a.note.trim() === "" ? undefined : a.note }
            : l,
        ),
      };
    case "CLEAR":
      return initial;
    case "SET_PAYMENT_METHOD":
      // Reset tendered when switching away from cash to avoid stale values.
      return {
        ...s,
        paymentMethod: a.method,
        cashTenderedSatang:
          a.method === "cash" ? s.cashTenderedSatang : 0,
      };
    case "SET_DISCOUNT":
      return { ...s, discountSatang: Math.max(0, a.satang) };
    case "SET_CASH_TENDERED":
      return { ...s, cashTenderedSatang: Math.max(0, a.satang) };
    case "SET_CUSTOMER":
      return { ...s, customer: { ...s.customer, ...a.patch } };
  }
}

const StateContext = createContext<State | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useCart(): State {
  const s = useContext(StateContext);
  if (!s) throw new Error("useCart must be used inside <CartProvider>");
  return s;
}

export function useCartDispatch(): Dispatch<Action> {
  const d = useContext(DispatchContext);
  if (!d) throw new Error("useCartDispatch must be used inside <CartProvider>");
  return d;
}
