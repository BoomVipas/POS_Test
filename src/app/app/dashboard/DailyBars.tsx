import { formatTHB } from "@/lib/money/format";

export function DailyBars({
  series,
}: {
  series: Array<{ date: string; totalSatang: number; bills: number }>;
}) {
  const max = Math.max(1, ...series.map((s) => s.totalSatang));
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Daily revenue
      </p>
      <ul className="mt-3 grid gap-1.5">
        {series.map((s) => {
          const pct = (s.totalSatang / max) * 100;
          const dayShort = s.date.slice(5); // MM-DD
          return (
            <li key={s.date} className="grid grid-cols-[40px_1fr_auto] items-center gap-2 text-sm">
              <span className="num text-[10px] font-bold text-muted">
                {dayShort}
              </span>
              <div className="h-3 overflow-hidden rounded-full bg-soft">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3d3686] to-[#2a2557]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="num shrink-0 text-xs font-extrabold text-accent-strong">
                {formatTHB(s.totalSatang)}
                {s.bills > 0 && (
                  <span className="ml-1 text-[10px] font-bold text-muted">
                    × {s.bills}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
