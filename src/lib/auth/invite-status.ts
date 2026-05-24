// DD-34 — pure invite-code usability check.
//
// Mirrors the gate inside the `redeem_invite_code` RPC (status + expiry) so the
// pre-signup validation step can reach the same verdict without a round-trip to
// the RPC (which needs an authenticated user). The server action runs this on a
// service-role lookup of the invite row, then collapses any failure into ONE
// generic client message — the distinct reason is for the server log only, so
// the public form can't be used to enumerate which codes exist (Wave 41 de-
// oracle posture). The reasons stay distinct *here* for logging + testing.

export type InviteUnusableReason = "used" | "cancelled" | "expired" | "unknown";

export type InviteCheck =
  | { ok: true }
  | { ok: false; reason: InviteUnusableReason };

export function checkInviteUsable(
  row: { status: string; expires_at: string | Date },
  now: Date,
): InviteCheck {
  if (row.status === "used") return { ok: false, reason: "used" };
  if (row.status === "cancelled") return { ok: false, reason: "cancelled" };
  if (row.status === "expired") return { ok: false, reason: "expired" };

  const expiresAt =
    row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: "expired" };
  }

  // Any non-active status that slipped past the explicit checks above.
  if (row.status !== "active") return { ok: false, reason: "unknown" };

  return { ok: true };
}
