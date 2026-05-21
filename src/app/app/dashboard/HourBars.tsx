import { formatTHB } from "@/lib/money/format";

export function HourBars({
  hourly,
}: {
  hourly: Array<{ hour: number; today: number; prev: number }>;
}) {
  const max = Math.max(1, ...hourly.flatMap((h) => [h.today, h.prev]));
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          By hour
        </p>
        <p className="text-[11px] text-muted">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
          today
          <span className="ml-3 mr-2 inline-block h-2 w-2 rounded-full bg-soft align-middle" />
          previous day
        </p>
      </div>
      <div className="mt-3 flex items-end gap-1.5 sm:gap-2.5">
        {hourly.map((h) => {
          const todayH = (h.today / max) * 100;
          const prevH = (h.prev / max) * 100;
          return (
            <div
              key={h.hour}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${h.hour}:00 — ${formatTHB(h.today)} THB`}
            >
              <div className="relative flex h-32 w-full items-end justify-center gap-0.5">
                <div
                  aria-hidden
                  className="w-2 rounded-t bg-soft"
                  style={{ height: `${prevH}%` }}
                />
                <div
                  aria-hidden
                  className="w-2 rounded-t bg-gradient-to-t from-[#3d3686] to-[#2a2557]"
                  style={{ height: `${todayH}%` }}
                />
              </div>
              <span className="text-[10px] text-muted">{h.hour}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
