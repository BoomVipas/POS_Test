import { describe, expect, it } from "vitest";
import {
  cancelInviteErrorToast,
  cancelInviteSuccessToast,
  humanizeCancelInviteError,
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
