// Wave 41e — /app layout guard decision (finding L5).
// Wave 42  — auth-error guard (Codex post-hoc finding).
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
//
// Wave 42: the layout reads workspace_members / workspaces via maybeSingle(),
// which returns { data: null, error } on a transient failure — indistinguishable
// from "no row" if the error is discarded. A query failure must therefore NOT be
// read as hasMember=false (which would bounce a real seller to /onboarding); it
// surfaces a distinct { kind: "error" } so the layout can show an honest, retry-
// able error state. queryError is checked AFTER auth (no queries run pre-auth)
// and BEFORE the membership check.

import { describe, expect, it } from "vitest";
import { resolveAppGuard } from "@/lib/app-guard";

describe("resolveAppGuard (Wave 41e, L5)", () => {
  it("stays in demo mode when Supabase is not configured", () => {
    const d = resolveAppGuard({
      configured: false,
      authenticated: false,
      queryError: false,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "demo", reason: "Supabase not configured" });
  });

  it("redirects an unauthenticated user to login", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: false,
      queryError: false,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "redirect", to: "/login?next=/app" });
  });

  it("redirects an authenticated orphan (no workspace_members row) to /onboarding", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      queryError: false,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "redirect", to: "/onboarding" });
  });

  it("redirects to /onboarding when a member row dangles to a missing workspace", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      queryError: false,
      hasMember: true,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "redirect", to: "/onboarding" });
  });

  it("admits a fully-provisioned member", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      queryError: false,
      hasMember: true,
      hasWorkspace: true,
    });
    expect(d).toEqual({ kind: "configured" });
  });
});

describe("resolveAppGuard (Wave 42, auth-error guard)", () => {
  it("surfaces an error when a membership/workspace lookup fails — NOT an onboarding redirect", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      queryError: true,
      // booleans are unreliable after a query error — both read false here,
      // exactly the shape that previously masqueraded as an orphan.
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "error" });
  });

  it("the error decision wins even if the (unreliable) booleans look provisioned", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: true,
      queryError: true,
      hasMember: true,
      hasWorkspace: true,
    });
    expect(d).toEqual({ kind: "error" });
  });

  it("demo (unconfigured) takes precedence over a stray query-error flag", () => {
    const d = resolveAppGuard({
      configured: false,
      authenticated: false,
      queryError: true,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "demo", reason: "Supabase not configured" });
  });

  it("auth check takes precedence over the error flag (no queries run pre-auth)", () => {
    const d = resolveAppGuard({
      configured: true,
      authenticated: false,
      queryError: true,
      hasMember: false,
      hasWorkspace: false,
    });
    expect(d).toEqual({ kind: "redirect", to: "/login?next=/app" });
  });
});
