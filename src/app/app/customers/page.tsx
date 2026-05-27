import Link from "next/link";
import { CustomersList } from "./CustomersList";
import { CustomersConfiguredServer } from "./CustomersConfiguredServer";
import type { LifecycleStage } from "@/lib/demo/customer-lifecycle";

export const dynamic = "force-dynamic";

const STAGES = new Set<string>(["new", "returning", "vip", "dormant"]);

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const rawStage = sp.stage ?? "all";
  const filter: LifecycleStage | "all" = STAGES.has(rawStage)
    ? (rawStage as LifecycleStage)
    : "all";

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
          Customers
        </h1>
        <Link
          href="/app"
          className="text-xs font-bold uppercase tracking-wider text-accent-strong"
        >
          ← Home
        </Link>
      </div>
      <p className="mt-1 text-sm text-text/85">
        Derived from past sales (phone-keyed). Lifecycle stage and lifetime
        spend update as new sales come in.
      </p>

      {isConfigured() ? (
        <CustomersConfiguredServer filter={filter} />
      ) : (
        <CustomersList />
      )}
    </main>
  );
}
