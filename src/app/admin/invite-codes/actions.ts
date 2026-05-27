"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/auth/admin-check";
import { formatDateTimeTH } from "@/lib/date";
import { sendEmail } from "@/lib/email/resend";
import { renderInviteEmail } from "@/lib/email/templates/invite";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/invite-code";

const NOT_CONFIGURED = "Supabase isn't configured on this deployment.";
const NOT_ADMIN = "You need admin access to do that.";

function guardError(reason: "not-configured" | "not-authed" | "not-admin"): string {
  return reason === "not-configured" ? NOT_CONFIGURED : NOT_ADMIN;
}

export type CancelInviteResult = { ok: true } | { ok: false; error: string };

export async function cancelInviteCode(
  inviteCodeId: string,
): Promise<CancelInviteResult> {
  const guard = await checkAdmin();
  if (!guard.ok) return { ok: false, error: guardError(guard.reason) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invite_codes")
    .update({ status: "cancelled" })
    .eq("id", inviteCodeId)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[admin] cancel invite code failed:", error.message);
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "no active invite" };
  }

  revalidatePath("/admin/invite-codes");
  return { ok: true };
}

export type ResendInviteResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

function registerUrl(h: Headers): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (env) return `${env}/register`;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}/register` : "/register";
}

export async function resendInviteEmail(
  inviteCodeId: string,
): Promise<ResendInviteResult> {
  const guard = await checkAdmin();
  if (!guard.ok) return { ok: false, error: guardError(guard.reason) };

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "Email sending is not configured." };
  }

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("invite_codes")
    .select("id, code, email, brand_name, status, expires_at")
    .eq("id", inviteCodeId)
    .single();

  if (error || !invite) {
    console.error("[admin] resend invite lookup failed:", error?.message);
    return { ok: false, error: "Invite code not found." };
  }

  if (invite.status !== "active") {
    return { ok: false, error: "Only active invite codes can be resent." };
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "That invite code has expired." };
  }

  try {
    const { subject, html } = renderInviteEmail({
      brandName: invite.brand_name,
      code: invite.code,
      expiresAt: formatDateTimeTH(invite.expires_at),
      registerUrl: registerUrl(await headers()),
    });
    await sendEmail({ to: invite.email, subject, html });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin] resend invite email failed:", msg);
    // Pass the real Resend error message back so the UI can show a specific reason.
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/invite-codes");
  return { ok: true, email: invite.email };
}

export type IssueInviteResult =
  | { ok: true; code: string; email: string; emailed: boolean }
  | { ok: false; error: string };

export async function issueInviteCode(
  email: string,
  brandName: string,
): Promise<IssueInviteResult> {
  const guard = await checkAdmin();
  if (!guard.ok) return { ok: false, error: guardError(guard.reason) };

  const emailTrimmed = email.trim().toLowerCase();
  const brandTrimmed = brandName.trim();

  if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!brandTrimmed) {
    return { ok: false, error: "Brand name is required." };
  }

  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInviteCode();
    const { error } = await supabase.from("invite_codes").insert({
      code: candidate,
      email: emailTrimmed,
      brand_name: brandTrimmed,
      status: "active",
      expires_at: expiresAt,
      application_id: null,
    });
    if (!error) {
      code = candidate;
      break;
    }
    if ((error as { code?: string }).code === "23505") continue;
    console.error("[admin] issue invite failed:", error.message);
    return { ok: false, error: "Couldn't create the invite code. Please try again." };
  }

  if (!code) {
    return { ok: false, error: "Couldn't generate a unique code. Please try again." };
  }

  let emailed = false;
  try {
    if (process.env.RESEND_API_KEY) {
      const { subject, html } = renderInviteEmail({
        brandName: brandTrimmed,
        code,
        expiresAt: formatDateTimeTH(expiresAt),
        registerUrl: registerUrl(await headers()),
      });
      await sendEmail({ to: emailTrimmed, subject, html });
      emailed = true;
    }
  } catch (e) {
    console.error("[admin] issue invite email failed:", e);
  }

  revalidatePath("/admin/invite-codes");
  return { ok: true, code, email: emailTrimmed, emailed };
}
