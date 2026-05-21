import { DashboardLive } from "./DashboardLive";

// The full multi-period dashboard (Wave 29/34) lives in DashboardLive — it
// composes every tile (revenue/orders/avg, payment split, profit/margin,
// source split, reorder, top sellers, inventory, activity feed, hourly/daily)
// with a Day/Range picker + period-over-period deltas, and falls back to
// illustrative mock data when no live sales exist. page.tsx had been rendering
// an older static 6-tile subset; this wires the real one in (PRD F15 gap:
// "built but not composed").
export default function DashboardPage() {
  return <DashboardLive />;
}
