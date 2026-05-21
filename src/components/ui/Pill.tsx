import { cn } from "@/lib/cn";

export type PillTone = "neutral" | "ok" | "warn" | "danger" | "accent";

const TONE_CLS: Record<PillTone, string> = {
  neutral: "bg-soft text-muted",
  ok: "bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)]",
  warn: "bg-[var(--color-warn-soft-bg)] text-[var(--color-warn-soft-fg)]",
  danger:
    "bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-soft-fg)]",
  accent:
    "bg-gradient-to-b from-[#3d3686] to-[#2a2557] text-[#ffffff]",
};

export function Pill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider",
        TONE_CLS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
