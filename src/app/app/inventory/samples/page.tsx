import { SampleBucketManager } from "./SampleBucketManager";

/**
 * Wave 39b — Sample bucket UI (demo mode).
 *
 * Lists products and lets the seller move units between event-sellable
 * stock and the sample bucket (units physically on display). Mirrors the
 * meowmeow Stock & Allocation Setup "Sample" column with explicit
 * Make / Return buttons.
 *
 * Demo mode uses localStorage. Real Supabase wiring (Wave 39 follow-up
 * after PR #4 merges) replaces the demo store with the
 * convert_event_to_sample / convert_sample_to_event RPCs.
 */
export default function InventorySamplesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Inventory · Wave 39b · demo mode
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-accent-strong">
          Sample bucket
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text/85">
          Units physically on display at the booth. Moving stock to sample
          reduces sellable event stock but never returns to warehouse — the
          sample sits on display through the event. Convert back when staff
          want to sell a sample as a normal product.
        </p>
      </header>
      <SampleBucketManager />
    </main>
  );
}
