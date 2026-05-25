// DD-26 — pure presentation logic for the admin Approve/Reject flow.
//
// Extracted from Actions.tsx / actions.ts (like the old applications-pending
// module it replaces) so the toast copy and the error mapping are testable in a
// node-environment Vitest without React or a database. The server action does
// the Supabase work; this file decides what the admin SEES.
//
// Error mapping is deliberately coarse: the RPC raises precise reasons
// ("application is invited (only pending can be approved)") for the server log,
// but the admin only needs an actionable sentence — and we don't echo raw DB
// text into the UI.

import type { ToastInput } from "@/components/ui/Toast";

export type ReviewAction = "approve" | "reject";

const ALREADY_HANDLED =
  "That application was already handled — refresh to see its current status.";

/** Map a raised RPC message to one friendly, actionable sentence. */
export function humanizeReviewError(
  action: ReviewAction,
  rawMessage: string | undefined | null,
): string {
  const m = (rawMessage ?? "").toLowerCase();
  if (m.includes("admin required")) return "You need admin access to do that.";
  if (m.includes("auth required")) return "Your session expired — sign in again.";
  if (m.includes("not found")) return "That application no longer exists.";
  // status guard: "...is invited/approved/rejected (only pending can be ...)"
  if (m.includes("only pending")) return ALREADY_HANDLED;
  return action === "approve"
    ? "Couldn't approve this application. Please try again."
    : "Couldn't reject this application. Please try again.";
}

/** Toast shown after a successful approve. Surfaces the code so the admin can
 *  hand it over even when email delivery is off/unconfigured. */
export function approveSuccessToast(code: string, emailed: boolean): ToastInput {
  return {
    kind: "success",
    title: "Approved — invite code created",
    message: emailed
      ? `${code} · emailed to the applicant.`
      : `${code} · email not sent (copy it to the seller manually).`,
    durationMs: emailed ? 5000 : 8000,
  };
}

export function rejectSuccessToast(): ToastInput {
  return {
    kind: "info",
    title: "Application rejected",
    message: "Moved to the Rejected list.",
  };
}

export function reviewErrorToast(
  action: ReviewAction,
  rawMessage: string | undefined | null,
): ToastInput {
  return {
    kind: "error",
    title: action === "approve" ? "Approve failed" : "Reject failed",
    message: humanizeReviewError(action, rawMessage),
  };
}
