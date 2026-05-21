import { CatalogManager } from "./CatalogManager";

export default function SetupProductsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">Products</h1>
      <p className="mt-2 text-text/85">Set up SKUs, prices, and images.</p>
      <p className="mt-1 text-xs text-muted">
        Demo mode: catalog saves to your browser. DD-43..54 will move it to the
        Supabase <code>products</code> table.
      </p>

      <CatalogManager />
    </main>
  );
}
