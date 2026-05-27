"use server";

import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/auth/admin-check";
import { createClient } from "@/lib/supabase/server";

export type CancelInviteResult = { ok: true } | { ok: false; error: string };

const NOT_CONFIGURED = "Supabase isn't configured on this deployment.";
const NOT_ADMIN = "You need admin access to do that.";

function guardError(reason: "not-configured" | "not-authed" | "not-admin"): string {
  return reason === "not-configured" ? NOT_CONFIGURED : NOT_ADMIN;
}

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
