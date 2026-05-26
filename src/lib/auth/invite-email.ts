// Wave 49 — the invite-gated Google sign-in guard.
//
// The password register flow creates the auth user WITH the invite's email
// (register/actions.ts createUser({ email: invite.email })), so the user and the
// invite always share an address. Google sign-in breaks that guarantee: the user
// arrives already authenticated as whatever Gmail they picked, which may not be
// the address the invite was issued to. `redeem_invite_code` keys the workspace
// off auth.uid() and does NOT re-check the email — so this match is the gate that
// stops a Google account from redeeming an invite meant for someone else.
//
// Kept pure (no Supabase, no I/O) so the rule is unit-tested and shared verbatim
// by the /auth/callback route.

export function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

// True only when both addresses are non-empty and equal after normalising case
// and surrounding whitespace. Deliberately strict: no Gmail dot/plus folding —
// invites are issued to an exact address, and loosening the match would widen the
// gate. An empty Google email (shouldn't happen, but be defensive) never matches.
export function inviteEmailMatches(
  googleEmail: string | null | undefined,
  inviteEmail: string | null | undefined,
): boolean {
  const a = normalizeEmail(googleEmail);
  const b = normalizeEmail(inviteEmail);
  return a.length > 0 && a === b;
}
