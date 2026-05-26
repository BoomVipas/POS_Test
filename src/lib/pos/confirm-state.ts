// POS confirm-path resolution (pure).
//
// Connectivity hedge (pilot decision: we assume a booth hotspot but must never
// lose a sale to a wifi blip). The live confirm calls the create_order Server
// Action, which can:
//   - succeed  → { ok: true, orderId }
//   - be rejected by the RPC (stock, perms, …) → { ok: false, error }
//   - throw (the Server Action itself is unreachable — network/transport drop) →
//     we pass `null` here.
// This maps any of those to what the cashier sees. The ONLY outcome that clears
// the cart is success; every failure keeps the cart and yields a retryable
// message. Keeping this pure lets us pin that invariant in a unit test.

export type SubmitResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export type ConfirmResolution =
  | { kind: "success"; orderId: string }
  | { kind: "failure"; message: string };

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server — check the connection and try again. Your cart is safe.";

/**
 * Resolve a submit outcome. Pass `null` when the Server Action call threw
 * (transport failure). Any failure → a retryable message; the caller must NOT
 * clear the cart unless the result is `{ kind: "success" }`.
 */
export function resolveSubmit(
  result: SubmitResult | null,
): ConfirmResolution {
  if (result && result.ok) {
    return { kind: "success", orderId: result.orderId };
  }
  if (result && !result.ok) {
    return { kind: "failure", message: result.error };
  }
  return { kind: "failure", message: NETWORK_ERROR_MESSAGE };
}

/** The cart may be cleared only on a successful, recorded sale. */
export function shouldClearCart(resolution: ConfirmResolution): boolean {
  return resolution.kind === "success";
}
