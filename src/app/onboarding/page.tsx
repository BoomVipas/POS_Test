import { OnboardingClient } from "./OnboardingClient";

// Net-new screen from screens/onboarding.html. Full 5-step wizard
// (invite-code redeem → account → brand → products → first event) with a
// client-side state machine, per-step validation, and Back/Next/Skip. The
// Products step is wired to the live demo catalog. Creating the account /
// workspace / event for real is backend-dependent (Supabase auth + events
// model); until that lands, "Finish" drops the seller into /app.
export default function OnboardingPage() {
  return <OnboardingClient />;
}
