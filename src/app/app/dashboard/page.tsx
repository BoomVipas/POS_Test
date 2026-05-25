import { DashboardLive } from "./DashboardLive";
import { DashboardConfigured } from "./DashboardConfigured";

// Configured (real Supabase) renders the live metrics dashboard (#48) backed by
// getDashboardMetrics (#47) over the workspace's real orders. Demo/unconfigured
// falls back to DashboardLive — the rich illustrative multi-tile view (Wave
// 29/34) driven by localStorage demo sales. Mirrors the configured/demo split
// used across /app (same env check as the /app layout).
export default function DashboardPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return configured ? <DashboardConfigured /> : <DashboardLive />;
}
