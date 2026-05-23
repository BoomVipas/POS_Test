"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, adminEmail } from "@/lib/email/resend";
import { renderNewApplicationEmail } from "@/lib/email/templates/new-application";
import {
  checkApplyRateLimit,
  clientIpFromHeaders,
} from "@/lib/rate-limit";
import { applicationFormSchema, type ApplicationFormValues } from "./schema";

export type SubmitApplicationResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function intOrNull(s: string | undefined | null): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function nullIfEmpty(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export async function submitApplication(
  values: ApplicationFormValues,
): Promise<SubmitApplicationResult> {
  const parsed = applicationFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), i.message]),
      ),
    };
  }
  const data = parsed.data;

  // Honeypot — if `website` is non-empty, silently succeed (don't tip off the bot).
  if (data.website && data.website.length > 0) {
    return { ok: true };
  }

  // Rate-limit by IP + hashed email (Hard Rule: public forms must be rate-limited).
  // Pre-Supabase in-process bridge; DD-16 ships the shared Supabase-backed version.
  const ip = clientIpFromHeaders(await headers());
  const limit = checkApplyRateLimit(ip, data.email);
  if (!limit.allowed) {
    return {
      ok: false,
      error: "Too many submissions. Please try again later.",
    };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      ok: false,
      error:
        "The application form is not yet wired to a database. Please contact the team directly.",
    };
  }

  const supabase = await createClient();
  const { data: row, error: dbErr } = await supabase
    .from("applications")
    .insert({
      owner_name: data.owner_name,
      phone: data.phone,
      email: data.email,
      brand_name: data.brand_name,
      product_category: data.product_category,
      social_link: nullIfEmpty(data.social_link),
      num_skus: intOrNull(data.num_skus),
      events_per_year: intOrNull(data.events_per_year),
      message: nullIfEmpty(data.message),
    })
    .select()
    .single();

  if (dbErr) {
    if (dbErr.code === "23505") {
      // De-oracle: a duplicate email returns the same success UI as a new
      // submission, so the form can't be used to enumerate who has applied
      // (finding L2). The applicant can still check progress at /apply/status.
      return { ok: true };
    }
    return { ok: false, error: dbErr.message };
  }

  // Best-effort admin notification.
  try {
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      const { subject, html } = renderNewApplicationEmail(row);
      await sendEmail({ to: adminEmail(), subject, html });
    }
  } catch (e) {
    console.error("[apply] admin notification failed:", e);
  }

  return { ok: true };
}
