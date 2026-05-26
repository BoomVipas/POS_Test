import { CloseDayWorkspace } from "./CloseDayWorkspace";
import { CloseDayReconcileLive } from "./CloseDayReconcileLive";
import { getCloseDayReconciliation, getCloseDayHistory } from "./actions";

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
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
        Close day
      </h1>
      <p className="mt-2 text-text/85">
        Reconcile counted cash against today&rsquo;s recorded cash sales.
      </p>
      {demoNote && (
        <p className="mt-1 text-xs text-muted">
          Demo mode: history saves to your browser.
        </p>
      )}
      <div className="mt-6">{children}</div>
    </main>
  );
}

export default async function CloseDayPage() {
  if (!isConfigured()) {
    return (
      <Shell demoNote>
        <CloseDayWorkspace />
      </Shell>
    );
  }

  const reconciliation = await getCloseDayReconciliation();
  if (!reconciliation) {
    // No workspace resolved — fall back to the demo sandbox (the /app layout
    // already guards true orphans).
    return (
      <Shell demoNote>
        <CloseDayWorkspace />
      </Shell>
    );
  }

  const history = await getCloseDayHistory();
  return (
    <Shell>
      <CloseDayReconcileLive initial={reconciliation} history={history} />
    </Shell>
  );
}
