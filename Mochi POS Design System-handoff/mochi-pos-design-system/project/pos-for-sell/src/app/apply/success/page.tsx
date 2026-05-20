import Link from "next/link";
import { getDict } from "@/lib/i18n/server";

export default async function ApplySuccessPage() {
  const { t } = await getDict();
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="font-display text-4xl leading-tight tracking-tight text-accent-strong">
          {t.apply.successTitle}
        </h1>
        <p className="mt-4 text-text/85">{t.apply.successBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-3 text-sm font-bold text-accent-strong"
          >
            {t.common.home}
          </Link>
          <Link
            href="/apply/status"
            className="btn-accent rounded-[var(--radius-md)] px-5 py-3 text-sm font-bold"
          >
            {t.landing.ctaStatus}
          </Link>
        </div>
      </section>
    </main>
  );
}
