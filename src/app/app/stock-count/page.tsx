import Link from "next/link";
import { StockCountManager } from "./StockCountManager";

export default function StockCountPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
          Stock count
        </h1>
        <Link
          href="/app"
          className="text-xs font-bold uppercase tracking-wider text-accent-strong"
        >
          ← Home
        </Link>
      </div>
      <p className="mt-1 text-sm text-text/85">
        Open a count session, walk the warehouse / event load-in, and commit.
        Variance per SKU is logged with a reason. Direct fix for warehouse
        drift after multi-day events.
      </p>

      <StockCountManager />
    </main>
  );
}
