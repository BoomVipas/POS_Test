import Link from "next/link";
import { AuditLogList } from "./AuditLogList";

export default function AuditLogPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">Audit log</h1>
      <p className="mt-2 text-text/85">
        Append-only history of demo-mode actions: settings updates, catalog
        edits, sales, voids, and send-later transitions.
      </p>
      <p className="mt-1 text-xs text-muted">
        Demo mode: localStorage. DD-97 will replace this with a workspace-scoped
        view of the Supabase <code>audit_logs</code> table.
      </p>

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
