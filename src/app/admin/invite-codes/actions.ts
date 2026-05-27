"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/auth/admin-check";
import { formatDateTimeTH } from "@/lib/date";
import { sendEmail } from "@/lib/email/resend";
import { renderInviteEmail } from "@/lib/email/templates/invite";
import { createClient } from "@/lib/supabase/server";

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
    console.error("[admin] resend invite email failed:", e);
    return { ok: false, error: "Couldn't resend this invite email." };
  }

  revalidatePath("/admin/invite-codes");
  return { ok: true, email: invite.email };
}
