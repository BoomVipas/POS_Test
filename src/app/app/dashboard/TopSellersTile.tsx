import { formatTHB } from "@/lib/money/format";

export function TopSellersTile({
  sellers,
}: {
  sellers: Array<{ sku: string; name: string; qty: number; revenueSatang: number }>;
}) {
  const max = Math.max(1, ...sellers.map((s) => s.revenueSatang));
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Top sellers today
      </p>
      <ul className="mt-3 grid gap-2">
        {sellers.map((s) => {
          const pct = (s.revenueSatang / max) * 100;
          return (
            <li key={s.sku}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-extrabold text-text">{s.name}</span>
                <span className="num text-muted">×{s.qty}</span>
                <span className="num shrink-0 font-extrabold text-accent-strong">
                  {formatTHB(s.revenueSatang)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-soft">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3d3686] to-[#2a2557]"
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
