// Wave 41e — pure decision core for the cashier-app (`/app`) layout (finding L5).
//
// The layout performs the Supabase I/O (is it configured? is there a user? a
// workspace_members row? a workspace?) and hands the resulting booleans here.
// Keeping the decision pure makes the orphan-user path testable without a live
// database, and keeps the policy in one readable place.

export interface AppGuardInput {
  /** Supabase env present (else the credential-free pilot demo). */
  configured: boolean;
  /** A Supabase auth user is present. */
  authenticated: boolean;
  /** The user has at least one workspace_members row. */
  hasMember: boolean;
  /** That membership resolves to an existing workspace. */
  hasWorkspace: boolean;
}

export type AppGuardDecision =
  | { kind: "demo"; reason: string }
  | { kind: "redirect"; to: string }
  | { kind: "configured" };

/**
 * L5: an authenticated user with no usable workspace must NOT silently land in
 * the demo sandbox (post-Supabase that hides the fact that a removed/never-
 * onboarded seller has no workspace). Such users go to /onboarding. Demo mode
 * is reserved for the case where Supabase simply isn't wired yet.
 */
export function resolveAppGuard(input: AppGuardInput): AppGuardDecision {
  if (!input.configured) {
    return { kind: "demo", reason: "Supabase not configured" };
  }
  if (!input.authenticated) {
    return { kind: "redirect", to: "/login?next=/app" };
  }
  if (!input.hasMember || !input.hasWorkspace) {
    return { kind: "redirect", to: "/onboarding" };
  }
  return { kind: "configured" };
}
