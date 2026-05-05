import { formatTHB } from "@/lib/money/format";

export function ProfitTile({
  revenueSatang,
  cogsSatang,
  profitSatang,
  marginPct,
  ordersWithCost,
  totalOrders,
}: {
  revenueSatang: number;
  cogsSatang: number;
  profitSatang: number;
  marginPct: number | null;
  ordersWithCost: number;
  totalOrders: number;
}) {
  const coverage = totalOrders > 0 ? Math.round((ordersWithCost / totalOrders) * 100) : 0;
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Profit today
        </p>
        {marginPct !== null && (
          <span className="rounded-full bg-[var(--color-ok-soft-bg)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--color-ok-soft-fg)]">
            {marginPct.toFixed(1)}% margin
          </span>
        )}
      </div>
      {marginPct === null ? (
        <p className="mt-2 text-sm text-muted">
          Add a unit cost to your products to see margin and profit here.
        </p>
      ) : (
        <>
          <p className="num mt-1 text-3xl font-black text-accent-strong">
            {formatTHB(profitSatang)} THB
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-muted">
                Revenue
              </p>
              <p className="num font-extrabold text-text">
                {formatTHB(revenueSatang)}
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-muted">
                COGS
              </p>
              <p className="num font-extrabold text-text">
                {formatTHB(cogsSatang)}
              </p>
            </div>
          </div>
          {coverage < 100 && totalOrders > 0 && (
            <p className="mt-2 text-[11px] text-muted">
              Margin computed from {ordersWithCost} of {totalOrders} order
              {totalOrders === 1 ? "" : "s"} ({coverage}% with cost).
            </p>
          )}
        </>
      )}
    </div>
  );
}
