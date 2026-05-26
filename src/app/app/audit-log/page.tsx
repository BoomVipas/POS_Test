import Link from "next/link";
import { AuditLogList } from "./AuditLogList";

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export default function AuditLogPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">Audit log</h1>
      <p className="mt-2 text-text/85">
        Append-only history of actions: settings updates, catalog edits, sales,
        voids, and send-later transitions.
      </p>
      {!isConfigured() && (
        <p className="mt-1 text-xs text-muted">
          Demo mode: history saves to your browser only.
        </p>
      )}

      <AuditLogList />

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}
