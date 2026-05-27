import Link from "next/link";
import { AuditLogList } from "./AuditLogList";
import { AuditLogConfiguredServer } from "./AuditLogConfiguredServer";

export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.action ?? null;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
        Audit log
      </h1>
      <p className="mt-2 text-text/85">
        Append-only history of actions: sales, voids, stock adjustments, and
        corrections.
      </p>
      {!isConfigured() && (
        <p className="mt-1 text-xs text-muted">
          Demo mode: history saves to your browser only.
        </p>
      )}

      {isConfigured() ? (
        <AuditLogConfiguredServer filter={filter} />
      ) : (
        <AuditLogList />
      )}

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}
