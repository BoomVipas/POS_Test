import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";

// DD-40 — auth callback for password-recovery (and future email) links.
//
// Supabase's default recovery email returns here with a PKCE `code` (exchanged
// for a session via the verifier cookie that resetPasswordForEmail set), or, if
// the project uses the token-hash email template, a `token_hash` + `type`
// (verified via verifyOtp). Either way, success establishes the recovery
// session and forwards to a safe `next` (the reset form). On failure we send the
// user to /login/reset, which — finding no session — shows "link expired, request
// a new one". `next` is sanitised against open redirects.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), "/app");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth/confirm] exchangeCodeForSession:", error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth/confirm] verifyOtp:", error.message);
  }

  return NextResponse.redirect(new URL("/login/reset", origin));
}
