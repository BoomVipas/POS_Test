"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin-check";
import { generateInviteCode } from "@/lib/invite-code";
import { sendEmail } from "@/lib/email/resend";
import { renderInviteEmail } from "@/lib/email/templates/invite";
import { formatDateTimeTH } from "@/lib/date";
import { humanizeReviewError } from "@/lib/admin/application-review";

export type ApproveResult =
  | { ok: true; code: string; emailed: boolean }
  | { ok: false; error: string };

export type RejectResult = { ok: true } | { ok: false; error: string };

const NOT_CONFIGURED = "Supabase isn't configured on this deployment.";
const NOT_ADMIN = "You need admin access to do that.";

function guardError(reason: "not-configured" | "not-authed" | "not-admin"): string {
  return reason === "not-configured" ? NOT_CONFIGURED : NOT_ADMIN;
}

// register URL for the invite email. Prefer an explicit site URL; otherwise
// rebuild the origin the admin is browsing from (works behind Vercel's proxy).
function registerUrl(h: Headers): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (env) return `${env}/register`;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}/register` : "/register";
}

/**
 * Approve a pending application: mint its invite code (atomic RPC), then
 * best-effort email it. The code is generated here (canonical ambiguity-safe
 * generator) and retried on the rare unique collision. Email failure never
 * fails the approval — the code is returned so the admin can hand it over.
 */
export async function approveApplication(
  applicationId: string,
): Promise<ApproveResult> {
  const guard = await checkAdmin();
  if (!guard.ok) return { ok: false, error: guardError(guard.reason) };

  const supabase = await createClient();

  let invite: {
    code: string;
    email: string;
    brand_name: string;
    expires_at: string;
  } | null = null;
  let lastErr = "";

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const { data, error } = await supabase.rpc("approve_application", {
      p_application_id: applicationId,
      p_code: code,
    });
    if (!error && data) {
      invite = data;
      break;
    }
    if (error) {
      lastErr = error.message;
      // 23505 = unique_violation on the code column → regenerate and retry.
      // Any other error is terminal (not-found / not-pending / not-admin).
      if ((error as { code?: string }).code === "23505") continue;
      break;
    }
  }

  if (!invite) {
    console.error("[admin] approve_application failed:", lastErr || "no row returned");
    return { ok: false, error: humanizeReviewError("approve", lastErr) };
  }

  // Best-effort invite email — mirrors the apply action: gated on RESEND config,
  // wrapped so a send failure can't roll back an approval that already committed.
  let emailed = false;
  try {
    if (process.env.RESEND_API_KEY) {
      const { subject, html } = renderInviteEmail({
        brandName: invite.brand_name,
        code: invite.code,
        expiresAt: formatDateTimeTH(invite.expires_at),
        registerUrl: registerUrl(await headers()),
      });
      await sendEmail({ to: invite.email, subject, html });
      emailed = true;
    }
  } catch (e) {
    console.error("[admin] invite email failed:", e);
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/invite-codes");
  return { ok: true, code: invite.code, emailed };
}

/** Reject a pending application (status → rejected, audited in one transaction). */
export async function rejectApplication(
  applicationId: string,
): Promise<RejectResult> {
  const guard = await checkAdmin();
  if (!guard.ok) return { ok: false, error: guardError(guard.reason) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_application", {
    p_application_id: applicationId,
  });

  if (error) {
    console.error("[admin] reject_application failed:", error.message);
    return { ok: false, error: humanizeReviewError("reject", error.message) };
  }

  revalidatePath("/admin/applications");
  return { ok: true };
}
