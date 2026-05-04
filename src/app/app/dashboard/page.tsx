import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-3xl text-accent-strong">Dashboard</h1>
      <p className="mt-2 text-text/85">
        Today&rsquo;s sales, payment split, top sellers, inventory remaining.
      </p>
      <p className="mt-2 text-sm text-muted">
        (DD-85 to DD-94 will wire today metrics, payment split, top sellers,
        inventory, day picker, hour bars, goal/pace, end-of-day close, and
        per-day + bulk CSV exports.)
      </p>

      <div className="panel mt-8 grid gap-4 p-6 sm:grid-cols-3">
        <Tile label="Total today" value="—" />
        <Tile label="Bills" value="—" />
        <Tile label="Avg bill" value="—" />
      </div>

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="num mt-1 text-2xl font-black text-accent-strong">
        {value}
      </p>
    </div>
  );
}
