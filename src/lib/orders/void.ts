// Pure validation for voiding an order. The Server Action + the void_order RPC
// both re-check (the RPC requires a non-empty reason); this gives instant client
// feedback and a unit-testable contract. A reason is mandatory because a void
// removes a recorded sale from the totals — it must be explainable in the audit.

export type VoidReasonValidation = { ok: true } | { ok: false; error: string };

export const MIN_VOID_REASON = 3;
export const MAX_VOID_REASON = 200;

export function validateVoidReason(reason: string): VoidReasonValidation {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_VOID_REASON) {
    return {
      ok: false,
      error: `Reason must be at least ${MIN_VOID_REASON} characters.`,
    };
  }
  if (trimmed.length > MAX_VOID_REASON) {
    return {
      ok: false,
      error: `Reason must be ${MAX_VOID_REASON} characters or fewer.`,
    };
  }
  return { ok: true };
}
