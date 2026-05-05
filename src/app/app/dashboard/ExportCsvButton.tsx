"use client";

import { useDemoSales } from "@/lib/demo/useDemoSales";
import { ordersForToday } from "@/lib/demo/dashboardMetrics";
import { toCsv } from "@/lib/csv";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isoDateInTZ } from "@/lib/date";

export function ExportCsvButton() {
  const { orders, ready } = useDemoSales();
  const { push } = useToast();

  function exportCsv() {
    const today = ordersForToday(orders);

    if (today.length === 0) {
      push({
        kind: "warn",
        title: "Nothing to export",
        message: "No orders recorded today.",
      });
      return;
    }

    // Flatten orders → one row per order_item.
    const rows = today.flatMap((o) =>
      o.items.map((it) => ({
        order_number: o.orderNumber,
        created_at: o.createdAt,
        sku: it.sku,
        product_name: it.productName,
        qty: it.qty,
        unit_price_baht: (it.unitPriceSatang / 100).toFixed(2),
        line_total_baht: (it.lineTotalSatang / 100).toFixed(2),
        fulfillment: it.fulfillmentType,
        order_total_baht: (o.totalSatang / 100).toFixed(2),
        payment_method: o.paymentMethod,
        customer_name: o.customerName ?? "",
        customer_phone: o.customerPhone ?? "",
        customer_email: o.customerEmail ?? "",
      })),
    );

    const csv = toCsv(rows);
    const today_iso = isoDateInTZ(new Date());
    const filename = `pos-for-sell-${today_iso}.csv`;

    // UTF-8 BOM so Excel-on-Windows opens it cleanly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    push({
      kind: "success",
      title: "CSV downloaded",
      message: `${rows.length} line item${rows.length === 1 ? "" : "s"} from today exported as ${filename}`,
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={exportCsv}
      disabled={!ready}
    >
      Export today as CSV
    </Button>
  );
}
