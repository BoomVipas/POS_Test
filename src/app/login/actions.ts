"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";
import { loginFormSchema, type LoginFormValues } from "./schema";

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
