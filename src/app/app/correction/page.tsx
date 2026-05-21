import Link from "next/link";
import { CorrectionList } from "./CorrectionList";

export default function CorrectionPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">Corrections</h1>
      <p className="mt-2 text-text/85">
        Void recorded sales and restore inventory. Voided orders are excluded
        from dashboard totals.
      </p>
      <p className="mt-1 text-xs text-muted">
        Demo mode: writes to localStorage. DD-96 will swap in the real
        <code> void_order</code> RPC.
      </p>

      <CorrectionList />

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}
