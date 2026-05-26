"use server";

import { createClient } from "@/lib/supabase/server";

export type IssueRegistrationTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function issueRegistrationToken(
  orderId: string,
): Promise<IssueRegistrationTokenResult> {
  if (!UUID_RE.test(orderId)) {
    return { ok: false, error: "This sale does not have a real order id." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_registration_token", {
    p_order_id: orderId,
  });

  if (error) {
    console.error("[portal] create_registration_token failed:", error.message);
    if (/forbidden/i.test(error.message)) {
      return {
        ok: false,
        error: "You don't have permission to issue a registration link.",
      };
    }
    if (/not found/i.test(error.message)) {
      return { ok: false, error: "This order could not be found." };
    }
    return {
      ok: false,
      error: "Couldn't create the registration link. Please try again.",
    };
  }

  return { ok: true, token: data };
}
