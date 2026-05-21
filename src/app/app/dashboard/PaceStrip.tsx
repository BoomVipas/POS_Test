import { formatTHB } from "@/lib/money/format";

export function PaceStrip({
  achievedSatang,
  targetSatang,
}: {
  achievedSatang: number;
  targetSatang: number;
}) {
  const pct = targetSatang > 0
    ? Math.min(100, Math.round((achievedSatang / targetSatang) * 100))
    : 0;
  const remaining = Math.max(0, targetSatang - achievedSatang);

  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Day goal
        </p>
        <p className="num text-sm font-bold text-muted">
          {formatTHB(achievedSatang)} / {formatTHB(targetSatang)} THB
        </p>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3d3686] to-[#2a2557] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2 text-xs text-muted">
        <span className="num">{pct}% achieved</span>
        <span className="num">
          {remaining > 0
            ? `${formatTHB(remaining)} THB to goal`
            : "Goal hit "}
        </span>
      </div>
    </div>
  );
}
