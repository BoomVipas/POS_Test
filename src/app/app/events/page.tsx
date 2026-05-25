import { mockProducts } from "../pos/mock-data";
import { EventSetupClient } from "./EventSetupClient";
import { EventsManagerLive, type EventSummary } from "./EventsManagerLive";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveWorkspace,
  canManageEvents,
  canWriteCatalog,
} from "@/lib/auth/workspace";

export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function EventsPage() {
  // Demo-mode MVP: the full setup wizard (schedule, gift rules, staff) on
  // localStorage. Real events + event_inventory persistence below.
  if (!isConfigured()) {
    return <EventSetupClient fallbackProducts={mockProducts} />;
  }

  const ws = await getActiveWorkspace();
  if (!ws) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
          Events
        </h1>
        <p className="mt-8 text-sm text-muted">
          We couldn&apos;t find your workspace. Please reload, or finish
          onboarding first.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: events }, { data: inv }, { count: activeProductCount }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, name, venue, start_date, end_date, status")
        .eq("workspace_id", ws.workspaceId)
        .order("created_at", { ascending: false }),
      supabase
        .from("event_inventory")
        .select("event_id, current_qty")
        .eq("workspace_id", ws.workspaceId),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", ws.workspaceId)
        .eq("is_active", true),
    ]);

  // Roll up per-event inventory (product count + units remaining).
  const byEvent = new Map<string, { count: number; qty: number }>();
  for (const r of inv ?? []) {
    const s = byEvent.get(r.event_id) ?? { count: 0, qty: 0 };
    s.count += 1;
    s.qty += r.current_qty;
    byEvent.set(r.event_id, s);
  }

  const eventSummaries: EventSummary[] = (events ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    venue: e.venue,
    start_date: e.start_date,
    end_date: e.end_date,
    status: e.status,
    productCount: byEvent.get(e.id)?.count ?? 0,
    totalCurrentQty: byEvent.get(e.id)?.qty ?? 0,
  }));

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
        Events
      </h1>
      <p className="mt-2 text-text/85">
        Create an event and allocate stock, then sell from it in the POS.
      </p>
      <EventsManagerLive
        events={eventSummaries}
        activeProductCount={activeProductCount ?? 0}
        canManage={canManageEvents(ws.role)}
        canAllocate={canWriteCatalog(ws.role)}
      />
    </main>
  );
}
