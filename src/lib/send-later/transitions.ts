// DD-79/80/81 — Send-later fulfillment status flow (pure logic).
//
// The forward flow is a straight line: pending → packed → shipped → completed.
// `cancelled` is reachable from any non-terminal status (a customer cancels, an
// address is bad, etc.). `completed` and `cancelled` are terminal — nothing
// advances out of them. This module is the single source of truth the Server
// Action and the UI both consult, so the rules can't drift between them.

import type { SendLaterStatus } from "@/lib/database.types";

export const SEND_LATER_STATUSES: readonly SendLaterStatus[] = [
  "pending",
  "packed",
  "shipped",
  "completed",
  "cancelled",
];

// The single forward step out of each non-terminal, non-cancel status.
const FORWARD: Partial<Record<SendLaterStatus, SendLaterStatus>> = {
  pending: "packed",
  packed: "shipped",
  shipped: "completed",
};

const TERMINAL: readonly SendLaterStatus[] = ["completed", "cancelled"];

export function isSendLaterStatus(v: unknown): v is SendLaterStatus {
  return (
    typeof v === "string" &&
    (SEND_LATER_STATUSES as readonly string[]).includes(v)
  );
}

export function isTerminal(status: SendLaterStatus): boolean {
  return TERMINAL.includes(status);
}

/** The next forward status, or null if there is none (shipped→completed is the last). */
export function nextStatus(status: SendLaterStatus): SendLaterStatus | null {
  return FORWARD[status] ?? null;
}

export type TransitionCheck =
  | { ok: true }
  | { ok: false; reason: "terminal" | "invalid" };

/**
 * Is moving `from` → `to` allowed? Two legal moves only: the single forward step
 * (via FORWARD), or a cancel from any non-terminal status. Everything else —
 * skipping a step, going backwards, or touching a terminal order — is rejected.
 */
export function canTransition(
  from: SendLaterStatus,
  to: SendLaterStatus,
): TransitionCheck {
  if (isTerminal(from)) return { ok: false, reason: "terminal" };
  if (to === "cancelled") return { ok: true };
  if (FORWARD[from] === to) return { ok: true };
  return { ok: false, reason: "invalid" };
}

/** Timestamp column stamped when an order enters `status` (null for `pending`). */
export function timestampColumnFor(
  status: SendLaterStatus,
): "packed_at" | "shipped_at" | "completed_at" | "cancelled_at" | null {
  switch (status) {
    case "packed":
      return "packed_at";
    case "shipped":
      return "shipped_at";
    case "completed":
      return "completed_at";
    case "cancelled":
      return "cancelled_at";
    default:
      return null;
  }
}
