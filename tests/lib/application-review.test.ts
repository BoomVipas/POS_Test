// DD-26 — admin Approve/Reject presentation logic.
//
// Replaces tests/lib/admin-applications-pending.test.ts (which pinned the
// pre-DD-26 "not yet wired" stub). Now that the buttons act for real, these
// pin: (1) RPC errors collapse to friendly, non-leaky sentences, and (2) the
// success toast surfaces the code AND whether it was emailed — so an admin on a
// deployment without Resend still sees the code to hand over.

import { describe, expect, it } from "vitest";
import {
  approveSuccessToast,
  humanizeReviewError,
  rejectSuccessToast,
  reviewErrorToast,
} from "@/lib/admin/application-review";

describe("humanizeReviewError", () => {
  it("maps the admin-gate raise", () => {
    expect(humanizeReviewError("approve", "approve_application: admin required")).toMatch(
      /admin access/i,
    );
  });

  it("maps the auth raise", () => {
    expect(humanizeReviewError("reject", "reject_application: auth required")).toMatch(
      /session expired/i,
    );
  });

  it("maps a missing application", () => {
    expect(
      humanizeReviewError("approve", "approve_application: application not found"),
    ).toMatch(/no longer exists/i);
  });

  it("maps the not-pending status guard to 'already handled' without leaking the raw status", () => {
    const raw =
      "approve_application: application is invited (only pending can be approved)";
    const out = humanizeReviewError("approve", raw);
    expect(out).toMatch(/already handled/i);
    // de-oracle: don't echo the raw RPC text / internal status into the UI.
    expect(out).not.toContain("approve_application");
    expect(out).not.toContain("invited");
  });

  it("falls back to an action-specific generic message", () => {
    expect(humanizeReviewError("approve", "some unexpected db error")).toMatch(
      /couldn't approve/i,
    );
    expect(humanizeReviewError("reject", "some unexpected db error")).toMatch(
      /couldn't reject/i,
    );
  });

  it("handles null/undefined messages", () => {
    expect(humanizeReviewError("approve", null)).toMatch(/couldn't approve/i);
    expect(humanizeReviewError("reject", undefined)).toMatch(/couldn't reject/i);
  });
});

describe("approveSuccessToast", () => {
  const CODE = "CATBOOTH-QP7C-MQ6A";

  it("is a success toast that always shows the code", () => {
    expect(approveSuccessToast(CODE, true).kind).toBe("success");
    expect(approveSuccessToast(CODE, true).message).toContain(CODE);
    expect(approveSuccessToast(CODE, false).message).toContain(CODE);
  });

  it("says emailed when sent, and tells the admin to copy it when not", () => {
    expect(approveSuccessToast(CODE, true).message).toMatch(/email/i);
    const notSent = approveSuccessToast(CODE, false).message;
    expect(notSent).toMatch(/not sent|manual/i);
  });

  it("lingers longer when the admin must copy the code by hand", () => {
    const sent = approveSuccessToast(CODE, true).durationMs ?? 0;
    const notSent = approveSuccessToast(CODE, false).durationMs ?? 0;
    expect(notSent).toBeGreaterThan(sent);
  });
});

describe("rejectSuccessToast / reviewErrorToast", () => {
  it("reject success is an info toast (not success — nothing was created)", () => {
    expect(rejectSuccessToast().kind).toBe("info");
  });

  it("error toast carries the action-specific title and humanized message", () => {
    const t = reviewErrorToast("approve", "approve_application: admin required");
    expect(t.kind).toBe("error");
    expect(t.title).toMatch(/approve failed/i);
    expect(t.message).toMatch(/admin access/i);
  });
});
