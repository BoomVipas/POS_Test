import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-2xl border border-line/60 bg-soft/60",
        className,
      )}
      {...rest}
    />
  );
}

/** Branded list-loading placeholder — a few shimmer bars in place of bare
 *  "Loading…" text. Keeps a screen-reader status for a11y. */
export function ListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-2.5", className)}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon && (
        <span
          className="grid h-14 w-14 place-items-center rounded-full bg-[var(--lavender-100)]"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <p className="font-display text-xl text-accent-strong">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body,
  action,
}: {
  title?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-5 py-4 text-[var(--color-danger-soft-fg)]"
    >
      <p className="text-sm font-extrabold">{title}</p>
      {body && <p className="mt-1 text-sm">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
