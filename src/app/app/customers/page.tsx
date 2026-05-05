import Link from "next/link";
import { CustomersList } from "./CustomersList";

export default function CustomersPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl text-accent-strong">Customers</h1>
        <Link
          href="/app"
          className="text-xs font-bold uppercase tracking-wider text-accent-strong"
        >
          ← Home
        </Link>
      </div>
      <p className="mt-1 text-sm text-text/85">
        Auto-derived from past sales (phone-keyed). Lifecycle stage and
        lifetime spend update as new sales come in.
      </p>
      <CustomersList />
    </main>
  );
}
