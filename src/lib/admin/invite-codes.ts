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

export function humanizeResendInviteError(
  rawMessage: string | undefined | null,
): string {
  const m = (rawMessage ?? "").toLowerCase();
  if (m.includes("admin access")) return "You need admin access to do that.";
  if (m.includes("session expired")) return "Your session expired - sign in again.";
  if (m.includes("email sending is not configured")) {
    return "Email sending is not configured. Copy the invite code to the seller manually.";
  }
  if (m.includes("not configured")) {
    return "Supabase is not configured on this deployment.";
  }
  if (m.includes("not found")) return "That invite code no longer exists.";
  if (m.includes("only active")) return "Only active invite codes can be resent.";
  if (m.includes("expired")) return "That invite code has expired.";
  return "Couldn't resend this invite email. Please try again.";
}

export function resendInviteSuccessToast(email: string): ToastInput {
  return {
    kind: "success",
    title: "Invite email resent",
    message: `Sent to ${email}.`,
  };
}

export function resendInviteErrorToast(
  rawMessage: string | undefined | null,
): ToastInput {
  return {
    kind: "error",
    title: "Resend failed",
    message: humanizeResendInviteError(rawMessage),
    durationMs: 7000,
  };
}
