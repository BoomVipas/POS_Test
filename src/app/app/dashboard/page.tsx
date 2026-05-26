import { DashboardLive } from "./DashboardLive";
import { DashboardConfiguredServer } from "./DashboardConfiguredServer";

// Configured (real Supabase) renders a server-fed dashboard over the workspace's
// real orders, payments, products, and event stock. Demo/unconfigured falls back
// to DashboardLive, the illustrative localStorage view.
export default function DashboardPage() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ? (
    <DashboardConfiguredServer />
  ) : (
    <DashboardLive />
  );
}
