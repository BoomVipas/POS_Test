import Link from "next/link";
import { SendLaterList } from "./SendLaterList";
import { SendLaterQueueLive } from "./SendLaterQueueLive";
import { getSendLaterQueue } from "./actions";
import { getActiveWorkspace, canManageEvents } from "@/lib/auth/workspace";

export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
        Send-later
      </h1>
      <p className="mt-2 text-text/85">
        Pending fulfillments and shipping status. Status flow:{" "}
        <strong>pending → packed → shipped → completed</strong>.
      </p>
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

export default async function SendLaterPage() {
  // Demo build (no Supabase): the localStorage-backed list.
  if (!isConfigured()) {
    return (
      <Shell>
        <p className="mt-1 text-xs text-muted">
          Demo mode: reads from localStorage.
        </p>
        <SendLaterList />
      </Shell>
    );
  }

  const ws = await getActiveWorkspace();
  if (!ws) {
    return (
      <Shell>
        <p className="mt-8 text-sm text-muted">
          We couldn&apos;t find your workspace. Please reload, or finish
          onboarding first.
        </p>
      </Shell>
    );
  }

  const queue = await getSendLaterQueue();
  return (
    <Shell>
      <SendLaterQueueLive initial={queue} canManage={canManageEvents(ws.role)} />
    </Shell>
  );
}
