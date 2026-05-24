"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// DD-41 — sign-out. Clears the Supabase session (the server client's setAll
// removes the auth cookies, which Server Actions are allowed to mutate), then
// drops the seller back at /login. revalidatePath busies the layout tree so the
// now-signed-out state is reflected immediately. redirect() throws NEXT_REDIRECT
// so nothing after it runs.
export async function signOut() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
