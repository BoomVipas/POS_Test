// Pure validation for a manual event-stock adjustment (restock / correction).
// The server action + the adjust_event_stock RPC re-check; this gives instant
// client feedback and a unit-testable contract.

export type DeltaValidation = { ok: true } | { ok: false; error: string };

export const MAX_STOCK_DELTA = 100_000;

export function validateStockDelta(
  delta: number,
  reason?: string,
): DeltaValidation {
  if (!Number.isInteger(delta)) {
    return { ok: false, error: "Adjustment must be a whole number." };
  }
  if (delta === 0) {
    return { ok: false, error: "Enter a non-zero adjustment." };
  }
  if (Math.abs(delta) > MAX_STOCK_DELTA) {
    return { ok: false, error: "That adjustment is too large." };
  }
  if (reason !== undefined && reason.length > 200) {
    return { ok: false, error: "Reason must be 200 characters or fewer." };
  }
  return { ok: true };
}
