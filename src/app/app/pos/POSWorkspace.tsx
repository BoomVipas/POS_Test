"use client";

import { CartProvider } from "@/lib/pos/cart-store";
import { POSModeProvider, type POSMode } from "@/lib/pos/pos-mode";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import type { Product } from "@/lib/pos/types";
import { ProductGrid } from "./ProductGrid";
import { CartPanel } from "./CartPanel";

/**
 * POS workspace data source:
 *  - **live** (Supabase configured): `fallbackProducts` are the real, server-
 *    fetched products for the active event (with `current_qty` from
 *    event_inventory). The demo-catalog override is OFF, and the confirm flow
 *    goes through the create_order RPC (see ReviewModal + POSMode).
 *  - **demo** (unconfigured): live demo catalog from /app/setup/products
 *    (localStorage) if non-empty, else the bundled mockProducts.
 */
export function POSWorkspace({
  fallbackProducts,
  live,
}: {
  fallbackProducts: Product[];
  live?: { workspaceId: string; eventId: string | null };
}) {
  const { items, ready } = useDemoCatalog();
  const activeDemo = ready ? items.filter((p) => p.is_active) : [];
  const products = live
    ? fallbackProducts
    : activeDemo.length > 0
      ? activeDemo
      : fallbackProducts;

  const posMode: POSMode = live
    ? { mode: "live", workspaceId: live.workspaceId, eventId: live.eventId }
    : { mode: "demo" };

  return (
    <POSModeProvider value={posMode}>
      <CartProvider>
        <div className="mx-auto flex max-w-7xl gap-5 px-3 py-4 lg:px-5">
          <div className="min-w-0 flex-1 pb-[40dvh] lg:pb-0">
            <ProductGrid products={products} />
          </div>
          <aside className="hidden w-[440px] flex-none lg:block">
            <div className="sticky top-4">
              <CartPanel products={products} />
            </div>
          </aside>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-30 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-panel/95 backdrop-blur shadow-[0_-12px_30px_rgba(28,24,56,0.12)] lg:hidden">
          <CartPanel products={products} compact />
        </div>
      </CartProvider>
    </POSModeProvider>
  );
}
