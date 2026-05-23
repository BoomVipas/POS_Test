// Pre-DD-26 toast content for the admin Approve/Reject buttons.
//
// These exist as a separate module (not inline in `Actions.tsx`) so they're
// testable from a node-environment Vitest without pulling in React. When
// DD-26 ships the real `approve_application` / `reject_application` server
// actions, this file goes away — its only job is to keep the pre-Supabase
// UI honest so an admin doesn't think they acted on something.

export type ToastShape = {
  kind: "info";
  title: string;
  message: string;
};

export const PENDING_APPROVE_TOAST: ToastShape = {
  kind: "info",
  title: "Not yet wired — DD-26",
  message:
    "Approve isn't connected to Supabase yet — see DD-26 in TASKS.md. No application status changed.",
};

export const PENDING_REJECT_TOAST: ToastShape = {
  kind: "info",
  title: "Not yet wired — DD-26",
  message:
    "Reject isn't connected to Supabase yet — see DD-26 in TASKS.md. No application status changed.",
};

/**
 * Returns the toast for a specific application id with a short reference
 * hash for human use. Falls back to the bare PENDING_* toast if id is empty.
 */
export function pendingApplicationToast(
  action: "approve" | "reject",
  applicationId: string,
): ToastShape {
  const base =
    action === "approve" ? PENDING_APPROVE_TOAST : PENDING_REJECT_TOAST;
  const shortId = applicationId.slice(0, 8);
  return {
    kind: base.kind,
    title: base.title,
    message: `${base.message} (Application ${shortId}…)`,
  };
}
