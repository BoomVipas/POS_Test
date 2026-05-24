// DD-34 — invite-code usability check (mirrors the redeem_invite_code RPC gate).

import { describe, expect, it } from "vitest";
import { checkInviteUsable } from "@/lib/auth/invite-status";

const NOW = new Date("2026-05-25T00:00:00Z");
const FUTURE = "2026-06-08T00:00:00Z"; // +14 days
const PAST = "2026-05-18T00:00:00Z"; // -7 days

describe("checkInviteUsable", () => {
  it("accepts an active, not-yet-expired code", () => {
    expect(checkInviteUsable({ status: "active", expires_at: FUTURE }, NOW)).toEqual({
      ok: true,
    });
  });

  it("rejects a used code", () => {
    expect(checkInviteUsable({ status: "used", expires_at: FUTURE }, NOW)).toEqual({
      ok: false,
      reason: "used",
    });
  });

  it("rejects a cancelled code", () => {
    expect(
      checkInviteUsable({ status: "cancelled", expires_at: FUTURE }, NOW),
    ).toEqual({ ok: false, reason: "cancelled" });
  });

  it("rejects an already-expired-status code", () => {
    expect(checkInviteUsable({ status: "expired", expires_at: FUTURE }, NOW)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects an active code past its expires_at", () => {
    expect(checkInviteUsable({ status: "active", expires_at: PAST }, NOW)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("treats the exact expiry instant as still usable; just past it as expired", () => {
    // Matches the RPC's strict `expires_at < now()`.
    expect(
      checkInviteUsable({ status: "active", expires_at: NOW.toISOString() }, NOW),
    ).toEqual({ ok: true });
    // one ms before now → expired
    expect(
      checkInviteUsable(
        { status: "active", expires_at: new Date(NOW.getTime() - 1).toISOString() },
        NOW,
      ),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("accepts a Date object for expires_at", () => {
    expect(
      checkInviteUsable({ status: "active", expires_at: new Date(FUTURE) }, NOW),
    ).toEqual({ ok: true });
  });

  it("rejects an unknown status as 'unknown'", () => {
    expect(checkInviteUsable({ status: "weird", expires_at: FUTURE }, NOW)).toEqual({
      ok: false,
      reason: "unknown",
    });
  });

  it("rejects an unparseable expires_at as expired", () => {
    expect(
      checkInviteUsable({ status: "active", expires_at: "not-a-date" }, NOW),
    ).toEqual({ ok: false, reason: "expired" });
  });
});
