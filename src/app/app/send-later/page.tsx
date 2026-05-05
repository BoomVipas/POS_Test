import Link from "next/link";
import { SendLaterList } from "./SendLaterList";

export default function SendLaterPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl text-accent-strong">Send-later</h1>
      <p className="mt-2 text-text/85">
        Pending fulfillments and shipping status. Status flow:{" "}
        <strong>pending → packed → shipped → completed</strong>.
      </p>
      <p className="mt-1 text-xs text-muted">
        Demo mode: reads from localStorage. DD-75..84 will move this to the
        Supabase <code>send_later_orders</code> table.
      </p>

      <SendLaterList />

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}
