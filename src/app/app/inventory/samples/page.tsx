import Link from "next/link";
import { SampleBucketManager } from "./SampleBucketManager";
import {
  SampleBucketManagerLive,
  type SampleRow,
} from "./SampleBucketManagerLive";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, canManageSamples } from "@/lib/auth/workspace";

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
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Inventory · Sample bucket
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-accent-strong">
          Sample bucket
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text/85">
          Units physically on display at the booth. Moving stock to sample
          reduces sellable event stock; convert back when staff want to sell a
          sample as a normal product.
        </p>
      </header>
      {children}
    </main>
  );
}

export default async function InventorySamplesPage() {
  // Demo build (no Supabase): localStorage-backed bucket.
  if (!isConfigured()) {
    return (
      <Shell>
        <SampleBucketManager />
      </Shell>
    );
  }

  const ws = await getActiveWorkspace();
  if (!ws) {
    return (
      <Shell>
        <p className="text-sm text-muted">
          We couldn&apos;t find your workspace. Please reload, or finish
          onboarding first.
        </p>
      </Shell>
    );
  }

  const supabase = await createClient();

  // Sample bucket is per-event; operate on the active event (the most recent
  // one still open for sales) — same resolution as the POS.
  const { data: ev } = await supabase
    .from("events")
    .select("id, name")
    .eq("workspace_id", ws.workspaceId)
    .in("status", ["planned", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ev) {
    return (
      <Shell>
        <div className="panel p-6 text-center">
          <p className="text-sm text-muted">
            No event open for sales. Create an event and allocate stock in{" "}
            <Link
              href="/app/events"
              className="font-bold text-accent-strong underline-offset-2 hover:underline"
            >
              Events
            </Link>{" "}
            first.
          </p>
        </div>
      </Shell>
    );
  }

  const [{ data: inv }, { data: prods }] = await Promise.all([
    supabase
      .from("event_inventory")
      .select("product_id, current_qty, sample_qty")
      .eq("event_id", ev.id)
      .eq("workspace_id", ws.workspaceId),
    supabase
      .from("products")
      .select("id, sku, name, is_active")
      .eq("workspace_id", ws.workspaceId),
  ]);

  const productById = new Map((prods ?? []).map((p) => [p.id, p]));
  const rows: SampleRow[] = (inv ?? [])
    .map((r) => {
      const p = productById.get(r.product_id);
      if (!p || !p.is_active) return null;
      return {
        productId: r.product_id,
        sku: p.sku,
        name: p.name,
        currentQty: r.current_qty,
        sampleQty: r.sample_qty,
      } satisfies SampleRow;
    })
    .filter((r): r is SampleRow => r !== null)
    .sort((a, b) => a.sku.localeCompare(b.sku));

  return (
    <Shell>
      <p className="-mt-3 mb-4 text-xs text-muted">
        At <strong className="text-accent-strong">{ev.name}</strong>
      </p>
      <SampleBucketManagerLive
        eventId={ev.id}
        rows={rows}
        canManage={canManageSamples(ws.role)}
      />
    </Shell>
  );
}
