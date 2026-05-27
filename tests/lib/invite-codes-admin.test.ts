import { describe, expect, it } from "vitest";
import {
  cancelInviteErrorToast,
  cancelInviteSuccessToast,
  humanizeCancelInviteError,
  humanizeResendInviteError,
  resendInviteErrorToast,
  resendInviteSuccessToast,
} from "@/lib/admin/invite-codes";

describe("humanizeCancelInviteError", () => {
  it("maps admin and auth guard errors to actionable copy", () => {
    expect(humanizeCancelInviteError("admin required")).toMatch(/admin access/i);
    expect(humanizeCancelInviteError("auth required")).toMatch(/session expired/i);
  });

  it("maps stale active-code updates to a refresh message", () => {
    const out = humanizeCancelInviteError("no active invite");
    expect(out).toMatch(/no longer active/i);
    expect(out).not.toContain("no active invite");
  });

  it("falls back to a generic cancel failure", () => {
    expect(humanizeCancelInviteError("unexpected db error")).toMatch(
      /couldn't cancel/i,
    );
    expect(humanizeCancelInviteError(null)).toMatch(/couldn't cancel/i);
  });
});

describe("cancel invite toasts", () => {
  it("uses info for success because no new resource was created", () => {
    const toast = cancelInviteSuccessToast();
    expect(toast.kind).toBe("info");
    expect(toast.message).toMatch(/no longer use/i);
  });

  it("uses an error toast with the humanized message", () => {
    const toast = cancelInviteErrorToast("admin required");
    expect(toast.kind).toBe("error");
    expect(toast.title).toMatch(/cancel failed/i);
    expect(toast.message).toMatch(/admin access/i);
  });
});

describe("humanizeResendInviteError", () => {
  it("maps admin and session failures", () => {
    expect(humanizeResendInviteError("You need admin access.")).toMatch(/admin access/i);
    expect(humanizeResendInviteError("Your session expired.")).toMatch(/session expired/i);
  });

  it("maps expected invite-code state failures", () => {
    expect(humanizeResendInviteError("Invite code not found.")).toMatch(/no longer exists/i);
    expect(humanizeResendInviteError("Only active invite codes can be resent.")).toMatch(
      /only active/i,
    );
    expect(humanizeResendInviteError("That invite code has expired.")).toMatch(/expired/i);
  });

  it("maps missing email configuration to a manual fallback", () => {
    expect(humanizeResendInviteError("Email sending is not configured.")).toMatch(
      /copy the invite code/i,
    );
  });

  it("falls back to a generic resend failure", () => {
    expect(humanizeResendInviteError("unexpected")).toMatch(/couldn't resend/i);
  });
});

describe("resend invite toasts", () => {
  it("shows the recipient email on success", () => {
    const toast = resendInviteSuccessToast("seller@example.com");
    expect(toast.kind).toBe("success");
    expect(toast.message).toContain("seller@example.com");
  });

  it("uses the humanized error copy", () => {
    const toast = resendInviteErrorToast("Only active invite codes can be resent.");
    expect(toast.kind).toBe("error");
    expect(toast.title).toMatch(/resend failed/i);
    expect(toast.message).toMatch(/only active/i);
  });
});
