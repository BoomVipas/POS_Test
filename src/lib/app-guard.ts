// Wave 41e — pure decision core for the cashier-app (`/app`) layout (finding L5).
// Wave 42  — auth-error guard (Codex post-hoc finding).
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
  /**
   * A membership/workspace lookup errored, so `hasMember` / `hasWorkspace`
   * below are unreliable. Wave 42: maybeSingle() returns { data: null, error }
   * on a transient failure — indistinguishable from "no row" once the error is
   * discarded. We must NOT read that null as `hasMember=false` and bounce a
   * real seller to /onboarding; surface a distinct error instead.
   */
  queryError: boolean;
  /** The user has at least one workspace_members row. */
  hasMember: boolean;
  /** That membership resolves to an existing workspace. */
  hasWorkspace: boolean;
}

export type AppGuardDecision =
  | { kind: "demo"; reason: string }
  | { kind: "redirect"; to: string }
  | { kind: "error" }
  | { kind: "configured" };

/**
 * L5: an authenticated user with no usable workspace must NOT silently land in
 * the demo sandbox (post-Supabase that hides the fact that a removed/never-
 * onboarded seller has no workspace). Such users go to /onboarding. Demo mode
 * is reserved for the case where Supabase simply isn't wired yet.
 *
 * Wave 42 precedence: demo → auth → query-error → membership → admit. The
 * error check sits after auth (no membership queries run before a user exists)
 * and before the membership check (a query error must not be read as "orphan").
 */
export function resolveAppGuard(input: AppGuardInput): AppGuardDecision {
  if (!input.configured) {
    return { kind: "demo", reason: "Supabase not configured" };
  }
  if (!input.authenticated) {
    return { kind: "redirect", to: "/login?next=/app" };
  }
  if (input.queryError) {
    return { kind: "error" };
  }
  if (!input.hasMember || !input.hasWorkspace) {
    return { kind: "redirect", to: "/onboarding" };
  }
  return { kind: "configured" };
}
