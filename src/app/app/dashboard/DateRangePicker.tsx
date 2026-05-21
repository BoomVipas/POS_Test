"use client";

import type { RangePresetId } from "@/lib/demo/dashboard-range";

const PRESETS: Array<{ id: RangePresetId; label: string }> = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "this_month", label: "This month" },
];

export function DateRangePicker({
  value,
  onChange,
}: {
  value: RangePresetId;
  onChange: (id: RangePresetId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          aria-pressed={value === p.id}
          className={
            value === p.id
              ? "rounded-full bg-[#2a2557] px-3 py-1 text-xs font-extrabold text-white"
              : "rounded-full bg-panel px-3 py-1 text-xs font-bold text-muted hover:text-accent-strong"
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
