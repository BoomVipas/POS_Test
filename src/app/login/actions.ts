"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";
import {
  loginFormSchema,
  forgotFormSchema,
  resetFormSchema,
  type LoginFormValues,
  type ResetFormValues,
} from "./schema";

// Discriminated by `reason` so the client can show a *localised* message: the
// action stays language-agnostic (mirrors the apply action), and the form maps
// the reason to a dict string. `message` is a sensible English fallback.
export type SignInResult = {
  ok: false;
  reason: "validation" | "invalid" | "config" | "unknown";
  message: string;
  fieldErrors?: Record<string, string>;
};

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function signIn(
  values: LoginFormValues,
  nextRaw?: string | null,
): Promise<SignInResult> {
  const parsed = loginFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "validation",
      message: "Please check the highlighted fields.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), i.message]),
      ),
    };
  }

  if (!isConfigured()) {
    return {
      ok: false,
      reason: "config",
      message: "Sign-in is not available in demo mode.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // One generic message regardless of which half is wrong — the form must not
    // double as an account-enumeration oracle. The real reason is logged server-
    // side for debugging only.
    console.error("[login] sign-in failed:", error.message);
    return { ok: false, reason: "invalid", message: "Email or password is incorrect." };
  }

  // signInWithPassword wrote the session cookies through the server client's
  // setAll (Server Actions have mutable cookies); refresh the layout tree so the
  // authenticated session is picked up, then send the seller where they meant to
  // go. redirect() throws NEXT_REDIRECT, so nothing after it runs.
  revalidatePath("/", "layout");
  redirect(safeNextPath(nextRaw));
}

// Build this deploy's origin from the request headers so the recovery email's
// link comes back to the same host. (Must also be in Supabase's Redirect-URL
// allowlist; the project Site URL is the fallback Supabase uses otherwise.)
async function requestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// DD-40 — request a password-reset email. Always resolves ok (even for an
// unknown / malformed-but-parseable address) so the form can't be used to probe
// which emails have accounts; the real error is logged server-side only.
export async function requestPasswordReset(
  rawEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = forgotFormSchema.safeParse({ email: rawEmail });
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };
  if (!isConfigured()) {
    return { ok: false, error: "Password reset isn't available in demo mode." };
  }

  const supabase = await createClient();
  const origin = await requestOrigin();
  const redirectTo = origin
    ? `${origin}/auth/confirm?next=/login/reset`
    : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    redirectTo ? { redirectTo } : undefined,
  );
  if (error) console.error("[reset] resetPasswordForEmail failed:", error.message);
  return { ok: true };
}

export type UpdatePasswordResult = {
  ok: false;
  reason: "validation" | "expired" | "config" | "unknown";
  message: string;
  fieldErrors?: Record<string, string>;
};
// On success this redirects to /app (throws NEXT_REDIRECT) and never returns.

// DD-40 — set a new password. Runs inside the recovery session established by
// /auth/confirm; if that session is missing/expired, the link is no longer valid.
export async function updatePassword(
  values: ResetFormValues,
): Promise<UpdatePasswordResult> {
  const parsed = resetFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "validation",
      message: "Please check the highlighted fields.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), i.message]),
      ),
    };
  }
  if (!isConfigured()) {
    return {
      ok: false,
      reason: "config",
      message: "Password reset isn't available in demo mode.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      reason: "expired",
      message: "Your reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    console.error("[reset] updateUser failed:", error.message);
    return {
      ok: false,
      reason: "unknown",
      message: "Couldn't update your password. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}
