import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl text-accent-strong">Sign in</h1>
        <p className="mt-3 text-text/85">
          Sign-in for pilot clients and platform admins.
        </p>
        <p className="mt-2 text-sm text-muted">
          (DD-39 will wire this page to Supabase Auth.)
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-4 py-2 text-sm font-bold text-accent-strong"
          >
            ← Home
          </Link>
          <Link
            href="/apply"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-4 py-2 text-sm font-bold text-accent-strong"
          >
            Apply to join
          </Link>
        </div>
      </section>
    </main>
  );
}
