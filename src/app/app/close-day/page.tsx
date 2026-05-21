import { CloseDayWorkspace } from "./CloseDayWorkspace";

export default function CloseDayPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">Close day</h1>
      <p className="mt-2 text-text/85">
        Reconcile counted cash against today&rsquo;s recorded cash sales.
      </p>
      <p className="mt-1 text-xs text-muted">
        Demo mode: history saves to your browser. DD-92 will move this to the
        Supabase <code>close_day_records</code> table.
      </p>

      <div className="mt-6">
        <CloseDayWorkspace />
      </div>
    </main>
  );
}
