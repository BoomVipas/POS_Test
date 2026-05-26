// Close-day cash reconciliation (pure logic).
//
// Expected cash in the drawer = the sum of CASH payment_records whose order is
// not voided. Split/mixed orders contribute only their cash tender (each tender
// is its own payment_records row). Change given to customers is never a payment
// record, so this is net cash taken — excluding the opening float. The Server
// Action reads the rows for today; this computes the number and is unit-tested.

export type CashPaymentRow = {
  order_id: string;
  payment_method: string;
  amount_satang: number;
};

export type OrderStatusRow = { id: string; status: string };

export type CloseDayReconciliation = {
  expectedCashSatang: number;
  cashPaymentCount: number;
};

const VOIDED = "voided";

export function computeExpectedCash(
  payments: CashPaymentRow[],
  orders: OrderStatusRow[],
): CloseDayReconciliation {
  const voided = new Set(
    orders.filter((o) => o.status === VOIDED).map((o) => o.id),
  );
  let expectedCashSatang = 0;
  let cashPaymentCount = 0;
  for (const p of payments) {
    if (p.payment_method !== "cash") continue;
    if (voided.has(p.order_id)) continue;
    expectedCashSatang += p.amount_satang;
    cashPaymentCount += 1;
  }
  return { expectedCashSatang, cashPaymentCount };
}

/** counted − expected: positive = surplus in the drawer, negative = short. */
export function computeDiscrepancy(
  countedSatang: number,
  expectedSatang: number,
): number {
  return countedSatang - expectedSatang;
}
