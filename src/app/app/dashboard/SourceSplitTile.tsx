import { formatTHB } from "@/lib/money/format";
import {
  orderSourceLabel,
  type OrderSource,
} from "@/lib/demo/sales";
import type { SourceSplitRow } from "@/lib/demo/source-split";

const TONE: Record<OrderSource, string> = {
  booth: "from-[#3d3686] to-[#2a2557]",
  qr_menu: "from-[#5b8a72] to-[#3f6a55]",
  line: "from-[#4cc764] to-[#2f9b48]",
  shopee: "from-[#ee4d2d] to-[#c93b1f]",
  lazada: "from-[#0f146e] to-[#080a4a]",
  tiktok: "from-[#000] to-[#222]",
  phone: "from-[#7886b8] to-[#5560a0]",
  other: "from-[#888] to-[#555]",
};

export function SourceSplitTile({
  rows,
  totalSatang,
}: {
  rows: SourceSplitRow[];
  totalSatang: number;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Revenue by source
      </p>
      <ul className="mt-3 grid gap-2">
        {rows.map((r) => {
          const pct =
            totalSatang > 0
              ? Math.round((r.revenueSatang / totalSatang) * 1000) / 10
              : 0;
          return (
            <li key={r.source}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-extrabold text-text">
                  {orderSourceLabel(r.source)}
                </span>
                <span className="num text-muted">× {r.bills}</span>
                <span className="num shrink-0 font-extrabold text-accent-strong">
                  {formatTHB(r.revenueSatang)}
                </span>
                <span className="num shrink-0 text-[11px] font-bold text-muted">
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-soft">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${TONE[r.source] ?? TONE.other}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
