// Pure validation for a sample-bucket move (event stock ↔ sample bucket). The
// Server Action + the convert_event_to_sample / convert_sample_to_event RPCs
// re-check; this gives instant client feedback and a unit-testable contract.
// `available` is current_qty when making a sample, sample_qty when returning.

export type SampleMoveValidation = { ok: true } | { ok: false; error: string };

export const MAX_SAMPLE_MOVE = 100_000;

export function validateSampleMove(
  qty: number,
  available: number,
): SampleMoveValidation {
  if (!Number.isInteger(qty)) {
    return { ok: false, error: "Quantity must be a whole number." };
  }
  if (qty <= 0) {
    return { ok: false, error: "Enter a quantity of at least 1." };
  }
  if (qty > MAX_SAMPLE_MOVE) {
    return { ok: false, error: "That quantity is too large." };
  }
  if (qty > available) {
    return { ok: false, error: `Only ${available} available to move.` };
  }
  return { ok: true };
}
