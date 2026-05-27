import type { ToastInput } from "@/components/ui/Toast";

const ALREADY_HANDLED =
  "That invite code is no longer active - refresh to see its current status.";

export function humanizeCancelInviteError(
  rawMessage: string | undefined | null,
): string {
  const m = (rawMessage ?? "").toLowerCase();
  if (m.includes("admin access") || m.includes("admin required")) {
    return "You need admin access to do that.";
  }
  if (m.includes("session expired") || m.includes("auth required")) {
    return "Your session expired - sign in again.";
  }
  if (m.includes("not found") || m.includes("no active invite")) {
    return ALREADY_HANDLED;
  }
  return "Couldn't cancel this invite code. Please try again.";
}

export function cancelInviteSuccessToast(): ToastInput {
  return {
    kind: "info",
    title: "Invite code cancelled",
    message: "The seller can no longer use that code to register.",
  };
}

export function cancelInviteErrorToast(
  rawMessage: string | undefined | null,
): ToastInput {
  return {
    kind: "error",
    title: "Cancel failed",
    message: humanizeCancelInviteError(rawMessage),
  };
}
