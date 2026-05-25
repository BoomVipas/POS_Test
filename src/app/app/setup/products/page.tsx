import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, canWriteCatalog } from "@/lib/auth/workspace";
import { CatalogManager } from "./CatalogManager";
import { CatalogManagerLive } from "./CatalogManagerLive";
import type { LiveProduct } from "./product-row";

export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const PRODUCT_COLUMNS =
  "id, sku, name, category, price_satang, shipping_fee_satang, default_starting_qty, send_later_enabled, is_active, note, image_path";

function Shell({
  subtitle,
  children,
}: {
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
        Products
      </h1>
      <p className="mt-2 text-text/85">Set up SKUs, prices, and stock.</p>
      {subtitle}
      {children}
    </main>
  );
}

export default async function SetupProductsPage() {
  // Demo (unconfigured) mode keeps the localStorage catalog showcase.
  if (!isConfigured()) {
    return (
      <Shell
        subtitle={
          <p className="mt-1 text-xs text-muted">
            Demo mode: catalog saves to your browser only.
          </p>
        }
      >
        <CatalogManager />
      </Shell>
    );
  }

  const ws = await getActiveWorkspace();
  if (!ws) {
    // The /app layout normally redirects orphan users to /onboarding; this is a
    // defensive fallback for a transient lookup miss.
    return (
      <Shell subtitle={null}>
        <p className="mt-8 text-sm text-muted">
          We couldn&apos;t find your workspace. Please reload, or finish
          onboarding first.
        </p>
      </Shell>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("workspace_id", ws.workspaceId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  const products = (data ?? []) as LiveProduct[];

  return (
    <Shell subtitle={null}>
      <CatalogManagerLive products={products} canWrite={canWriteCatalog(ws.role)} />
    </Shell>
  );
}
