// Wave 41e — /app layout guard decision (finding L5).
//
// resolveAppGuard is the pure decision core for the cashier-app layout. The
// layout does the Supabase I/O, then this function decides the outcome from the
// resulting booleans — so the orphan-user behaviour is unit-testable without a
// live database.
//
// L5: an authenticated user with no workspace_members row used to fall into
// demo mode (and see localStorage data). Post-Supabase that's wrong — a removed
// seller would still see their own demo sandbox. Such users now go to
// /onboarding. Demo mode survives only when Supabase isn't configured (the
// credential-free pilot build).

import { describe, expect, it } from "vitest";
import { resolveAppGuard } from "@/lib/app-guard";

describe("resolveAppGuard (Wave 41e, L5)", () => {
  it("stays in demo mode when Supabase is not configured", () => {
    const d = resolveAppGuard({
      configured: false,
      authenticated: false,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "demo", reason: "Supabase not configured" });
  });

  it("redirects an unauthenticated user to login", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: false,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "redirect", to: "/login?next=/app" });
  });

  it("redirects an authenticated orphan (no workspace_members row) to /onboarding", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "redirect", to: "/onboarding" });
  });

  it("redirects to /onboarding when a member row dangles to a missing workspace", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      hasMember: true,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "redirect", to: "/onboarding" });
  });

  it("admits a fully-provisioned member", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      hasMember: true,
      hasWorkspace: true,
    });
    expect(d).toEqual({ kind: "configured" });
  });
});
