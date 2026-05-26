import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeNextPath } from "@/lib/auth/safe-next";
import { checkInviteUsable } from "@/lib/auth/invite-status";
import { inviteEmailMatches } from "@/lib/auth/invite-email";
import { isValidSlug } from "@/lib/slug";

// Wave 49 — OAuth (Google) callback.
//
// Two arrivals land here, both with a PKCE `code` that we exchange for a session
// (the verifier cookie was set browser-side by signInWithOAuth):
//
//   • LOGIN  (/auth/callback?next=/app) — an existing seller signing in. After
//     the exchange we require an existing workspace membership; a Google account
//     with none is bounced and signed out, so Google can't become an open public
//     signup (ROADMAP §14.4 invite-only).
//
//   • REGISTER (/auth/callback?invite=CODE&slug=foo) — redeeming an invite with
//     Google instead of a password. The invite is issued to a specific email, but
//     the user arrives as whatever Gmail they chose, so we re-validate the invite
//     server-side AND require the Google email to match invite.email before
//     redeeming (redeem_invite_code keys off auth.uid() and does NOT re-check the
//     email — this is the gate). Mirrors register/actions.completeRegistration.
//
// Cookies set/cleared on `supabase` here are flushed onto the redirect response
// by Next's mutable cookie store (same mechanism /auth/confirm relies on).

function adminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const inviteCode = (searchParams.get("invite") ?? "").trim().toUpperCase();
  const slug = (searchParams.get("slug") ?? "").trim().toLowerCase();
  const next = safeNextPath(searchParams.get("next"), "/app");
  const isRegister = inviteCode.length > 0;

  // Where a failure should send the user back to, with a short, non-oracular
  // reason the page can localise. Register errors return to /register.
  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(
        `${isRegister ? "/register" : "/login"}?error=${reason}`,
        origin,
      ),
    );

  if (!code) return fail("oauth");

  const supabase = await createClient();
  const { data: exchanged, error: exErr } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exErr || !exchanged?.user) {
    console.error("[auth/callback] exchange failed:", exErr?.message);
    return fail("oauth");
  }
  const user = exchanged.user;

  // ── REGISTER: validate invite, match the email, then redeem. ──────────────
  if (isRegister) {
    if (!adminConfigured()) {
      await supabase.auth.signOut();
      return fail("config");
    }
    const admin = createAdminClient();
    const { data: invite, error: invErr } = await admin
      .from("invite_codes")
      .select("code, email, brand_name, status, expires_at")
      .eq("code", inviteCode)
      .maybeSingle();
    if (invErr) console.error("[auth/callback] invite lookup failed:", invErr.message);
    if (!invite || !checkInviteUsable(invite, new Date()).ok) {
      await supabase.auth.signOut();
      return fail("invite");
    }

    // The gate: the signed-in Google account must be the invited address.
    if (!inviteEmailMatches(user.email, invite.email)) {
      console.warn(
        `[auth/callback] invite ${inviteCode} email mismatch (google != invited)`,
      );
      await supabase.auth.signOut();
      return fail("email-mismatch");
    }

    if (!isValidSlug(slug)) {
      await supabase.auth.signOut();
      return fail("slug");
    }

    const { error: redeemErr } = await supabase.rpc("redeem_invite_code", {
      p_code: inviteCode,
      p_brand_name: invite.brand_name,
      p_slug: slug,
    });
    if (redeemErr) {
      console.error("[auth/callback] redeem failed:", redeemErr.message);
      const pgCode = (redeemErr as { code?: string }).code;
      if (pgCode === "23505" || /slug|duplicate|unique/i.test(redeemErr.message)) {
        // Slug taken between the form's pre-check and now. Sign out so they can
        // retry cleanly with a different address (no orphaned half-session).
        await supabase.auth.signOut();
        return fail("slug-taken");
      }
      // Authenticated but unredeemed — the /app guard routes them to recover.
      return fail("redeem");
    }

    return NextResponse.redirect(new URL("/app", origin));
  }

  // ── LOGIN: invite-only — require an existing workspace membership. ────────
  const { data: membership, error: memErr } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (memErr) console.error("[auth/callback] membership check failed:", memErr.message);
  if (!membership) {
    // A Google account with no workspace never went through an invite. Don't let
    // signing in mint an account — bounce and sign out (keeps it invite-only).
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=needs-invite", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
