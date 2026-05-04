import Link from "next/link";

export default function SendLaterPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-3xl text-accent-strong">Send-later</h1>
      <p className="mt-2 text-text/85">
        Pending fulfillments and shipping status.
      </p>
      <p className="mt-2 text-sm text-muted">
        (DD-75 to DD-84 will wire the customer info form, status flow, tracking
        numbers, customer notification emails, CSV export, and cancellation.)
      </p>

      <div className="panel mt-8 p-6 text-center">
        <p className="font-display text-xl text-accent-strong">
          No pending fulfillments.
        </p>
        <p className="mt-2 text-sm text-muted">
          Send-later orders appear here after a sale that includes one or more
          send-later lines.
        </p>
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
