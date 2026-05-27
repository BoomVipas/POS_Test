import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { PawPrint } from "lucide-react";
import Link from "next/link";
import { formatTHB } from "@/lib/money/format";
import { formatDateTH } from "@/lib/date";

// ── types ────────────────────────────────────────────────────────────────────

type LifecycleStage = "new" | "returning" | "vip" | "dormant";

const STAGE_TONE: Record<LifecycleStage, PillTone> = {
  new: "accent",
  returning: "ok",
  vip: "warn",
  dormant: "neutral",
};

const STAGE_LABEL: Record<LifecycleStage, string> = {
  new: "New",
  returning: "Returning",
  vip: "VIP",
  dormant: "Dormant",
};

type CustomerRow = {
  phone: string;
  name: string | null;
  orderCount: number;
  totalSatang: number;
  firstOrderAt: string;
  lastOrderAt: string;
  daysSinceLast: number;
  stage: LifecycleStage;
  topSku: string | null;
  topSkuQty: number;
};

// ── data helpers (module-level, not component render) ─────────────────────────

const VIP_ORDER_COUNT = 5;
const VIP_LIFETIME_SATANG = 500_000; // ฿5,000
const DORMANT_DAYS = 90;

function stageFrom(
  orderCount: number,
  totalSatang: number,
  daysSinceLast: number,
): LifecycleStage {
  if (daysSinceLast >= DORMANT_DAYS) return "dormant";
  if (orderCount >= VIP_ORDER_COUNT || totalSatang >= VIP_LIFETIME_SATANG)
    return "vip";
  if (orderCount >= 2) return "returning";
  return "new";
}

async function loadCustomers(workspaceId: string): Promise<{
  rows: CustomerRow[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("id, customer_phone, customer_name, total_satang, created_at")
    .eq("workspace_id", workspaceId)
    .neq("status", "voided")
    .not("customer_phone", "is", null)
    .order("created_at", { ascending: true });

  if (ordersErr) return { rows: [], error: ordersErr.message };
  if (!orders || orders.length === 0) return { rows: [], error: null };

  const orderIds = orders.map((o) => o.id);
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, sku, qty")
    .in("order_id", orderIds);

  // Build per-phone top-SKU map.
  const orderToPhone = new Map(orders.map((o) => [o.id, o.customer_phone!]));
  const skuQty = new Map<string, Map<string, number>>();
  for (const item of items ?? []) {
    const phone = orderToPhone.get(item.order_id);
    if (!phone) continue;
    const m = skuQty.get(phone) ?? new Map<string, number>();
    m.set(item.sku, (m.get(item.sku) ?? 0) + item.qty);
    skuQty.set(phone, m);
  }

  // Aggregate per phone.
  const byPhone = new Map<
    string,
    {
      name: string | null;
      orderCount: number;
      totalSatang: number;
      firstOrderAt: string;
      lastOrderAt: string;
    }
  >();
  for (const o of orders) {
    const phone = o.customer_phone!;
    const ex = byPhone.get(phone);
    if (!ex) {
      byPhone.set(phone, {
        name: o.customer_name,
        orderCount: 1,
        totalSatang: o.total_satang,
        firstOrderAt: o.created_at,
        lastOrderAt: o.created_at,
      });
    } else {
      ex.orderCount += 1;
      ex.totalSatang += o.total_satang;
      if (o.created_at > ex.lastOrderAt) ex.lastOrderAt = o.created_at;
      if (!ex.name && o.customer_name) ex.name = o.customer_name;
    }
  }

  const nowMs = Date.now();
  const rows: CustomerRow[] = Array.from(byPhone.entries()).map(([phone, d]) => {
    let topSku: string | null = null;
    let topSkuQty = 0;
    for (const [sku, qty] of (skuQty.get(phone) ?? new Map()).entries()) {
      if (qty > topSkuQty) {
        topSku = sku;
        topSkuQty = qty;
      }
    }
    const daysSinceLast = Math.floor(
      (nowMs - Date.parse(d.lastOrderAt)) / 86400000,
    );
    return {
      phone,
      name: d.name,
      orderCount: d.orderCount,
      totalSatang: d.totalSatang,
      firstOrderAt: d.firstOrderAt,
      lastOrderAt: d.lastOrderAt,
      daysSinceLast,
      stage: stageFrom(d.orderCount, d.totalSatang, daysSinceLast),
      topSku,
      topSkuQty,
    };
  });

  rows.sort((a, b) => {
    const order = { vip: 0, returning: 1, new: 2, dormant: 3 };
    const sd = order[a.stage] - order[b.stage];
    return sd !== 0 ? sd : b.lastOrderAt.localeCompare(a.lastOrderAt);
  });

  return { rows, error: null };
}

// ── component ─────────────────────────────────────────────────────────────────

export async function CustomersConfiguredServer({
  filter,
}: {
  filter: LifecycleStage | "all";
}) {
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const { rows, error } = await loadCustomers(ws.workspaceId);

  if (error) {
    return (
      <p className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]">
        Failed to load customers: {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="panel mt-8 p-8 text-center">
        <span
          className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-[var(--lavender-100)]"
          aria-hidden
        >
          <PawPrint className="h-6 w-6 text-[var(--lavender-700)]" />
        </span>
        <p className="font-display text-xl text-accent-strong">
          No customers yet
        </p>
        <p className="mt-2 text-sm text-muted">
          Customers appear here when a sale captures a phone number.
        </p>
        <Link
          href="/app/pos"
          className="btn-accent mt-4 inline-flex rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold"
        >
          Open POS
        </Link>
      </div>
    );
  }

  const stageCounts = rows.reduce<Record<LifecycleStage, number>>(
    (acc, r) => {
      acc[r.stage] = (acc[r.stage] ?? 0) + 1;
      return acc;
    },
    { new: 0, returning: 0, vip: 0, dormant: 0 },
  );

  const visible =
    filter === "all" ? rows : rows.filter((r) => r.stage === filter);

  const stages: Array<LifecycleStage | "all"> = [
    "all",
    "new",
    "returning",
    "vip",
    "dormant",
  ];

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {stages.map((s) => {
          const count = s === "all" ? rows.length : (stageCounts[s] ?? 0);
          if (s !== "all" && count === 0) return null;
          return (
            <a
              key={s}
              href={
                s === "all" ? "/app/customers" : `/app/customers?stage=${s}`
              }
              className={
                filter === s
                  ? "rounded-full bg-[#2a2557] px-3 py-1 text-xs font-extrabold text-white"
                  : "rounded-full bg-panel px-3 py-1 text-xs font-bold text-muted hover:text-accent-strong"
              }
            >
              {s === "all"
                ? `All ${rows.length}`
                : `${STAGE_LABEL[s]} ${count}`}
            </a>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No {filter} customers.{" "}
          <a href="/app/customers" className="font-bold underline">
            Show all
          </a>
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {visible.map((r) => (
            <li
              key={r.phone}
              className="rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-extrabold text-text">
                      {r.name ?? "—"}
                    </span>
                    <span className="num text-xs text-muted">{r.phone}</span>
                    <Pill tone={STAGE_TONE[r.stage]}>
                      {STAGE_LABEL[r.stage]}
                    </Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {r.orderCount} order{r.orderCount === 1 ? "" : "s"} · last{" "}
                    {r.daysSinceLast === 0
                      ? "today"
                      : `${r.daysSinceLast} day${r.daysSinceLast === 1 ? "" : "s"} ago`}{" "}
                    · since {formatDateTH(r.firstOrderAt)}
                  </p>
                  {r.topSku && (
                    <p className="mt-0.5 text-xs text-muted">
                      Top SKU:{" "}
                      <strong className="font-extrabold text-text">
                        {r.topSku}
                      </strong>{" "}
                      <span className="num">×{r.topSkuQty}</span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="num text-base font-extrabold text-accent-strong">
                    {formatTHB(r.totalSatang)} THB
                  </p>
                  <p className="text-[11px] text-muted">lifetime spend</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
