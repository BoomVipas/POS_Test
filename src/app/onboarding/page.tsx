import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "./OnboardingClient";

// P1-B fix: This page is the redirect target for authenticated users who have
// no workspace (orphan users). It must NOT be accessible to unauthenticated
// visitors — someone who hasn't signed in should not see any part of the app
// shell, even the setup wizard.
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  return <OnboardingClient />;
}
