"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { checkInviteUsable } from "@/lib/auth/invite-status";
import { accountFormSchema, type AccountFormValues } from "./schema";

// Registration needs the service role (anon can't read invite_codes under RLS,
// and we create the auth user server-side), so "configured" here also requires
// the service-role key.
function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function normalizeCode(raw: string): string {
  return (raw ?? "").trim().toUpperCase();
}

// One generic message for every invite-lookup failure (not-found / used /
// cancelled / expired / db error) so the public form can't be used to enumerate
// which codes exist. The real reason is logged server-side only.
const INVALID_CODE =
  "That invite code isn't valid. Check it, or contact the team for a new one.";

export type ValidateInviteResult =
  | { ok: true; brandName: string; email: string; suggestedSlug: string }
  | { ok: false; error: string };

export async function validateInviteCode(
  rawCode: string,
): Promise<ValidateInviteResult> {
  const code = normalizeCode(rawCode);
  if (code.length < 3) return { ok: false, error: "Enter your invite code." };
  if (!isConfigured()) {
    return { ok: false, error: "Registration isn't available in demo mode." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .select("code, email, brand_name, status, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[register] invite lookup failed:", error.message);
    return { ok: false, error: INVALID_CODE };
  }
  if (!data) return { ok: false, error: INVALID_CODE };

  const usable = checkInviteUsable(data, new Date());
  if (!usable.ok) {
    console.warn(`[register] invite ${code} unusable: ${usable.reason}`);
    return { ok: false, error: INVALID_CODE };
  }

  return {
    ok: true,
    brandName: data.brand_name,
    email: data.email,
    suggestedSlug: generateSlug(data.brand_name),
  };
}

export type CompleteRegistrationResult = {
  ok: false;
  reason:
    | "validation"
    | "code"
    | "slug-taken"
    | "email-taken"
    | "config"
    | "unknown";
  message: string;
  fieldErrors?: Record<string, string>;
};
// On success this redirects to /app (throws NEXT_REDIRECT) and never returns.

export async function completeRegistration(
  rawCode: string,
  values: AccountFormValues,
): Promise<CompleteRegistrationResult> {
  const parsed = accountFormSchema.safeParse(values);
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
      message: "Registration isn't available in demo mode.",
    };
  }

  const code = normalizeCode(rawCode);
  const slug = parsed.data.slug.trim().toLowerCase();
  if (!isValidSlug(slug)) {
    return {
      ok: false,
      reason: "validation",
      message: "That workspace address isn't valid.",
      fieldErrors: { slug: "Lowercase letters, numbers and hyphens only" },
    };
  }

  const admin = createAdminClient();

  // Re-validate the invite server-side — never trust the client's earlier check.
  const { data: invite, error: invErr } = await admin
    .from("invite_codes")
    .select("code, email, brand_name, status, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (invErr || !invite || !checkInviteUsable(invite, new Date()).ok) {
    if (invErr) console.error("[register] invite re-lookup failed:", invErr.message);
    return {
      ok: false,
      reason: "code",
      message: "That invite code isn't valid anymore. Please start over.",
    };
  }

  // Slug uniqueness pre-check, so a collision doesn't strand a freshly-created
  // auth user with no workspace (the redeem insert would fail on the unique
  // constraint after the user already exists).
  const { data: slugRow } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugRow) {
    return {
      ok: false,
      reason: "slug-taken",
      message: "That workspace address is taken.",
      fieldErrors: { slug: "Already taken — try another" },
    };
  }

  // Create a confirmed user — the invite is the verification, so this is robust
  // whether or not email-confirmation is enabled on the project. (Service-role,
  // server-only — hard rule #4.)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: invite.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "";
    console.error("[register] createUser failed:", msg);
    if (/already|registered|exists/i.test(msg)) {
      return {
        ok: false,
        reason: "email-taken",
        message: "An account already exists for this email. Please sign in instead.",
      };
    }
    return {
      ok: false,
      reason: "unknown",
      message: "Couldn't create your account. Please try again.",
    };
  }

  // Establish the session as the new user (server client writes the cookies), so
  // redeem_invite_code sees auth.uid().
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password: parsed.data.password,
  });
  if (signInErr) {
    console.error("[register] post-create sign-in failed:", signInErr.message);
    return {
      ok: false,
      reason: "unknown",
      message: "Your account was created but sign-in failed. Try signing in.",
    };
  }

  const { error: redeemErr } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
    p_brand_name: invite.brand_name,
    p_slug: slug,
  });
  if (redeemErr) {
    console.error("[register] redeem_invite_code failed:", redeemErr.message);
    const pgCode = (redeemErr as { code?: string }).code;
    if (pgCode === "23505" || /slug|duplicate|unique/i.test(redeemErr.message)) {
      return {
        ok: false,
        reason: "slug-taken",
        message: "That workspace address was just taken. Pick another.",
        fieldErrors: { slug: "Already taken — try another" },
      };
    }
    return {
      ok: false,
      reason: "unknown",
      message: "Couldn't finish setting up your workspace. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}
