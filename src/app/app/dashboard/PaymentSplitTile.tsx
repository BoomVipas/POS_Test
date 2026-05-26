import { formatTHB } from "@/lib/money/format";

type Split = {
  cash: number;
  promptpay: number;
  transfer: number;
  card: number;
  other: number;
};

const LABELS: Record<keyof Split, string> = {
  cash: "Cash",
  promptpay: "PromptPay",
  transfer: "Transfer",
  card: "Card",
  other: "Other",
};

const ORDER: Array<keyof Split> = [
  "cash",
  "promptpay",
  "transfer",
  "card",
  "other",
];

export function PaymentSplitTile({ split }: { split: Split }) {
  const total = ORDER.reduce((sum, key) => sum + split[key], 0);
  const dominant = ORDER.reduce(
    (best, key) => (split[key] > split[best] ? key : best),
    ORDER[0],
  );

  return (
    <section className="rounded-[var(--radius-xl)] border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-black text-accent-strong">
            Payment split
          </h2>
          <p className="mt-1 text-sm text-muted">
            {total > 0
              ? `${LABELS[dominant]} is the largest payment source.`
              : "No payments in this range yet."}
          </p>
        </div>
        <div className="rounded-[14px] bg-[var(--indigo-50)] px-3 py-2 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">
            Total
          </p>
          <p className="num text-sm font-black text-accent-strong">
            {formatTHB(total)} THB
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {ORDER.map((key) => {
          const value = split[key];
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={key} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-text">{LABELS[key]}</p>
                <p className="num text-sm font-black text-accent-strong">
                  {formatTHB(value)} THB
                  <span className="ml-2 text-xs font-bold text-muted">
                    {pct}%
                  </span>
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--grad-accent)]"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
