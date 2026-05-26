import Link from "next/link";
import { RegisterClient } from "./RegisterClient";
import { claimRegistrationToken } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Customer Portal landing page (Wave 40b — demo mode).
 *
 * Renders against a token from the URL. The token IS the credential.
 * Demo mode reads/writes localStorage; when Wave 40a (PR #5) merges
 * + Supabase wires up, this becomes a server-component fetch using
 * the admin Supabase client to validate the token before render.
 *
 * Per VISION.md: this page must work without auth. The customer scans
 * a QR or follows a share link from the seller's receipt; they never
 * sign in. Token validation + claim are the only writes; both go
 * through the server-side claim_registration_token RPC in production.
 */
export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return (
      <main className="mx-auto max-w-lg px-5 py-12">
        <div className="panel p-6 text-center">
          <h1 className="font-display text-2xl text-accent-strong">
            Invalid link
          </h1>
          <p className="mt-3 text-sm text-muted">
            This registration link is malformed. Ask the booth staff for a new
            one.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2 text-sm font-bold text-accent-strong"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const canValidate =
    configured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  let linkUnavailable = false;

  if (canValidate) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("customer_registration_tokens")
        .select("claimed_at, expires_at")
        .eq("token", token)
        .maybeSingle();

      linkUnavailable = !data || Boolean(data.claimed_at);
    } catch (error) {
      console.error("[portal] token validation failed:", error);
    }
  }

  if (linkUnavailable) {
    return (
      <main className="mx-auto max-w-lg px-5 py-12">
        <div className="panel p-6 text-center">
          <h1 className="font-display text-2xl text-accent-strong">
            Link unavailable
          </h1>
          <p className="mt-3 text-sm text-muted">
            This registration link is already used or no longer available. Ask
            the booth staff for a new one.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2 text-sm font-bold text-accent-strong"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <RegisterClient
      token={token}
      claimAction={configured ? claimRegistrationToken : undefined}
    />
  );
}

export const dynamic = "force-dynamic";
