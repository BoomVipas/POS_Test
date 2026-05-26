import Link from "next/link";
import { CorrectionList } from "./CorrectionList";
import { CorrectionListLive } from "./CorrectionListLive";
import { getRecentOrders } from "./actions";
import { getActiveWorkspace, canManageOrders } from "@/lib/auth/workspace";

export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function Shell({
  demoNote,
  children,
}: {
  demoNote?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
        Corrections
      </h1>
      <p className="mt-2 text-text/85">
        Void recorded sales and restore inventory. Voided orders are excluded
        from dashboard totals.
      </p>
      {demoNote && (
        <p className="mt-1 text-xs text-muted">
          Demo mode: writes to localStorage.
        </p>
      )}
      {children}
      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}

export default async function CorrectionPage() {
  if (!isConfigured()) {
    return (
      <Shell demoNote>
        <CorrectionList />
      </Shell>
    );
  }

  const ws = await getActiveWorkspace();
  if (!ws) {
    // /app layout guards true orphans; fall back to the demo sandbox.
    return (
      <Shell demoNote>
        <CorrectionList />
      </Shell>
    );
  }

  const orders = await getRecentOrders();
  return (
    <Shell>
      <CorrectionListLive orders={orders} canManage={canManageOrders(ws.role)} />
    </Shell>
  );
}
