import { getActiveWorkspace } from "@/lib/auth/workspace";
import {
  getLiveStock,
  getPaymentBreakdown,
  getRevenueByDay,
  getTodayStats,
  getTopProducts,
} from "@/lib/dashboard/queries";
import { DashboardLive } from "./DashboardLive";
import { DashboardConfiguredClient } from "./DashboardConfiguredClient";

export async function DashboardConfiguredServer() {
  const workspace = await getActiveWorkspace();
  if (!workspace) return <DashboardLive />;

  const [todayStats, revenueByDay, paymentBreakdown, topProducts, liveStock] =
    await Promise.all([
      getTodayStats(workspace.workspaceId),
      getRevenueByDay(workspace.workspaceId),
      getPaymentBreakdown(workspace.workspaceId),
      getTopProducts(workspace.workspaceId),
      getLiveStock(workspace.workspaceId),
    ]);

  return (
    <DashboardConfiguredClient
      todayStats={todayStats}
      revenueByDay={revenueByDay}
      paymentBreakdown={paymentBreakdown}
      topProducts={topProducts}
      liveStock={liveStock}
    />
  );
}
