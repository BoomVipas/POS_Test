"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { RegisterFormSchema, type RegisterFormValues } from "./schema";
import type { Database } from "@/lib/database.types";
import { buildClaimRegistrationPayload } from "@/lib/customer-registration/payload";

export type ClaimRegistrationResult =
  | { ok: true; customerId: string }
  | { ok: false; error: string };

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function claimRegistrationToken(
  token: string,
  values: RegisterFormValues,
): Promise<ClaimRegistrationResult> {
  if (!isConfigured()) {
    return {
      ok: false,
      error: "Customer registration is not connected to Supabase yet.",
    };
  }

  const parsed = RegisterFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form fields." };
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("claim_registration_token", {
    p_token: token,
    p_payload: buildClaimRegistrationPayload(parsed.data),
  });

  if (error) {
    console.error("[portal] claim_registration_token failed:", error.message);
    if (/invalid token/i.test(error.message)) {
      return {
        ok: false,
        error:
          "This registration link is unavailable. Ask the booth staff for a new one.",
      };
    }
    return {
      ok: false,
      error: "Couldn't save your profile. Please try again.",
    };
  }

  return { ok: true, customerId: data };
}
