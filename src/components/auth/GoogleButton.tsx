"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Wave 49 — "Continue with Google" trigger, shared by /login and /register.
//
// Kicks off the PKCE OAuth flow: signInWithOAuth stores the code-verifier in a
// cookie and navigates to Google; Google returns to `redirectTo` (our
// /auth/callback route) with a `code` the server exchanges for a session.
//
// The callback path differs per page, and register's path embeds the live slug
// from the form, so callers pass EITHER a static `path` (login) or a
// `resolvePath` closure evaluated at click time (register). A resolver may veto
// the click by returning `{ error }` (shown inline) instead of `{ path }`.
//
// Renders nothing when Supabase isn't configured (demo mode) — Google needs a
// real project + provider, so the button would only ever error there.

type Resolved = { path: string } | { error: string };

export function GoogleButton({
  label,
  genericError,
  dividerLabel,
  path,
  resolvePath,
}: {
  label: string;
  /** Localized fallback shown if signInWithOAuth itself fails to start. */
  genericError: string;
  dividerLabel?: string;
  path?: string;
  resolvePath?: () => Resolved;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  async function start() {
    setError(null);
    const resolved: Resolved = resolvePath
      ? resolvePath()
      : { path: path ?? "" };
    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${resolved.path}` },
      });
      if (oauthErr) throw oauthErr;
      // Success → the browser is now navigating to Google. Keep `pending` true
      // so the button stays disabled through the redirect.
    } catch (e) {
      console.error("[google-auth] signInWithOAuth failed:", e);
      setError(genericError);
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      {dividerLabel ? (
        <div className="flex items-center gap-3 py-1" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            {dividerLabel}
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2.5 rounded-[14px] border border-line bg-panel py-3.5 text-[15px] font-extrabold text-text shadow-[var(--shadow-card)] transition hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 disabled:opacity-60"
      >
        <GoogleGlyph />
        {pending ? "…" : label}
      </button>
    </div>
  );
}

// The official four-colour Google "G". Decorative — the button text labels it.
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
