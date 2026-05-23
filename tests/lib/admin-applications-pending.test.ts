// Wave 41b — admin Approve/Reject must not lie until DD-26 wires them.
//
// Before this fix, clicking Approve in /admin/applications fired a toast
// saying "Approved (mock)" with a message implying an invite code had been
// generated. Nothing actually happened — DD-26 is blocked on Supabase. A
// real admin reading that toast would believe they had approved a seller.
//
// The fix: extract the toast content into pure exports so it's testable
// without React/jsdom, and assert the new content is honest about the
// pre-DD-26 state.

import { describe, expect, it } from "vitest";
import {
  PENDING_APPROVE_TOAST,
  PENDING_REJECT_TOAST,
  pendingApplicationToast,
} from "@/lib/admin/applications-pending";

describe("admin applications pending toast (Wave 41b, finding L3)", () => {
  it("approve toast does NOT claim the application was approved", () => {
    const lowered = PENDING_APPROVE_TOAST.title.toLowerCase();
    expect(lowered).not.toContain("approved (mock)");
    // "approved" alone is OK only if paired with a clear "not yet" / "pending"
    // — but the safer assertion is: the title must include the DD-26 marker
    // so anyone reading it sees the explicit batch reference.
    expect(PENDING_APPROVE_TOAST.title).toContain("DD-26");
  });

  it("reject toast does NOT claim the application was rejected", () => {
    const lowered = PENDING_REJECT_TOAST.title.toLowerCase();
    expect(lowered).not.toContain("rejected (mock)");
    expect(PENDING_REJECT_TOAST.title).toContain("DD-26");
  });

  it("approve toast uses the 'info' kind, not 'success' (success would imply the action happened)", () => {
    expect(PENDING_APPROVE_TOAST.kind).toBe("info");
  });

  it("reject toast uses the 'info' kind for consistency", () => {
    expect(PENDING_REJECT_TOAST.kind).toBe("info");
  });

  it("pendingApplicationToast('approve', id) embeds a short application id", () => {
    const id = "abcdef12-3456-7890-abcd-ef1234567890";
    const toast = pendingApplicationToast("approve", id);
    // Short hash for human reference, not the full uuid.
    expect(toast.message).toContain(id.slice(0, 8));
    expect(toast.message).not.toContain(id); // no full uuid leak
    // Must reference what blocked the action so admin knows where to look.
    expect(toast.message).toContain("DD-26");
  });

  it("pendingApplicationToast('reject', id) same shape, reject phrasing", () => {
    const id = "abcdef12-3456-7890-abcd-ef1234567890";
    const toast = pendingApplicationToast("reject", id);
    expect(toast.message).toContain(id.slice(0, 8));
    expect(toast.message).toContain("DD-26");
  });
});
