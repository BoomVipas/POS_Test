"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import { useDemoCustomerNotes } from "@/lib/demo/useDemoCustomerNotes";
import { useDemoCloseDay } from "@/lib/demo/useDemoCloseDay";
import { useDemoPreOrders } from "@/lib/demo/useDemoPreOrders";
import { useDemoClaims } from "@/lib/demo/useDemoClaims";
import { writeDemoSettings, DEFAULT_DEMO_SETTINGS } from "@/lib/demo/settings";

export function DangerZone() {
  const { clear: clearCatalog, items } = useDemoCatalog();
  const { clear: clearSales, orders } = useDemoSales();
  const { clear: clearAudit, entries, log } = useDemoAudit();
  const { clear: clearCustomerNotes } = useDemoCustomerNotes();
  const { clear: clearCloseDay } = useDemoCloseDay();
  const { clear: clearPreOrders } = useDemoPreOrders();
  const { clear: clearClaims } = useDemoClaims();
  const { push } = useToast();

  function clearAll() {
    if (
      !confirm(
        "Reset all demo data? This wipes your demo catalog, recorded sales, customer notes, audit log, and settings from this browser. Cannot be undone.",
      )
    ) {
      return;
    }
    // Log the reset BEFORE clearing audit, then clear audit.
    log({
      action: "demo_reset",
      targetTable: "demo",
      targetId: null,
      summary: `Reset all: ${items.length} products, ${orders.length} sales, ${entries.length} audit entries`,
    });
    clearCatalog();
    clearSales();
    clearAudit();
    clearCustomerNotes();
    clearCloseDay();
    clearPreOrders();
    clearClaims();
    writeDemoSettings(DEFAULT_DEMO_SETTINGS);
    push({
      kind: "warn",
      title: "Demo data reset",
      message:
        "Catalog, sales, customer notes, audit log, and settings cleared. Refresh to see the changes everywhere.",
    });
  }

  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-danger-soft-fg)]/30 bg-[var(--color-danger-soft-bg)]/40 p-5">
      <h2 className="font-display text-lg text-[var(--color-danger-soft-fg)]">
        Danger zone
      </h2>
      <p className="mt-1 text-sm text-text/85">
        Wipe everything stored in this browser: {items.length} product
        {items.length === 1 ? "" : "s"}, {orders.length} recorded sale
        {orders.length === 1 ? "" : "s"}, {entries.length} audit entr
        {entries.length === 1 ? "y" : "ies"}, and your settings. Real Supabase
        data is unaffected (and not stored in this browser anyway).
      </p>
      <Button
        type="button"
        variant="danger"
        size="sm"
        className="mt-3"
        onClick={clearAll}
      >
        Reset all demo data
      </Button>
    </div>
  );
}
