import Link from "next/link";
import { mockProducts } from "./mock-data";
import { POSWorkspace } from "./POSWorkspace";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import type { Product } from "@/lib/pos/types";
import { productImageUrl } from "@/lib/products/image";

export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function NoActiveEvent() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-accent-strong">
        No event open for sales
      </h1>
      <p className="mt-2 text-text/85">
        Create an event and allocate your products, then come back here to sell.
      </p>
      <Link
        href="/app/events"
        className="btn-accent mt-6 inline-block rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-bold"
      >
        Go to Events →
      </Link>
    </main>
  );
}

export default async function POSPage() {
  // Demo (unconfigured): bundled mock catalog + localStorage demo catalog.
  if (!isConfigured()) {
    return <POSWorkspace fallbackProducts={mockProducts} />;
  }

  const ws = await getActiveWorkspace();
  if (!ws) {
    // /app layout guards orphans; defensive fallback to the demo sandbox.
    return <POSWorkspace fallbackProducts={mockProducts} />;
  }

  const supabase = await createClient();

  // Active event = the most recent one still open for sales.
  const { data: ev } = await supabase
    .from("events")
    .select("id, name")
    .eq("workspace_id", ws.workspaceId)
    .in("status", ["planned", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ev) return <NoActiveEvent />;

  // Two simple queries (no relational select, to stay clean with the hand-rolled
  // types), joined in JS by product_id. The POS sells products that are BOTH
  // active AND allocated to this event.
  const [{ data: inv }, { data: prods }] = await Promise.all([
    supabase
      .from("event_inventory")
      .select("product_id, current_qty")
      .eq("event_id", ev.id)
      .eq("workspace_id", ws.workspaceId),
    supabase
      .from("products")
      .select(
        "id, sku, name, category, price_satang, shipping_fee_satang, send_later_enabled, is_active, image_path",
      )
      .eq("workspace_id", ws.workspaceId)
      .eq("is_active", true),
  ]);

  const qtyByProduct = new Map((inv ?? []).map((r) => [r.product_id, r.current_qty]));
  const products: Product[] = (prods ?? [])
    .filter((p) => qtyByProduct.has(p.id))
    .map((p) => ({
      id: p.id,
      workspace_id: ws.workspaceId,
      sku: p.sku,
      name: p.name,
      category: p.category,
      price_satang: p.price_satang,
      shipping_fee_satang: p.shipping_fee_satang,
      send_later_enabled: p.send_later_enabled,
      is_active: p.is_active,
      // Real products store a Storage path in image_path; the POS card renders
      // it as an <img src>, so resolve it to a public URL here (null stays null
      // → monogram fallback). #45.
      image_path: productImageUrl(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        p.image_path,
      ),
      current_qty: qtyByProduct.get(p.id) ?? 0,
    }));

  return (
    <>
      <div className="mx-auto max-w-7xl px-3 pt-3 lg:px-5">
        <p className="text-xs text-muted">
          Selling at{" "}
          <strong className="text-accent-strong">{ev.name}</strong>
        </p>
      </div>
      <POSWorkspace
        fallbackProducts={products}
        live={{ workspaceId: ws.workspaceId, eventId: ev.id }}
      />
    </>
  );
}
