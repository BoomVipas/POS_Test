import Link from "next/link";
import { getDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function HomePage() {
  const { t } = await getDict();

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-3xl items-center justify-end px-5 pt-4">
        <LanguageSwitcher />
      </div>
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">
          {t.landing.kicker}
        </p>
        <h1 className="font-display text-5xl leading-[0.92] tracking-tight text-accent-strong sm:text-6xl">
          {t.landing.title1}
          <br />
          {t.landing.title2}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text/85">
          {t.landing.body}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/apply"
            className="btn-accent inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-base font-bold"
          >
            {t.landing.ctaApply}
          </Link>
          <Link
            href="/apply/status"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-panel px-5 py-3 text-sm font-bold text-accent-strong"
          >
            {t.landing.ctaStatus}
          </Link>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2">
          <Feature
            title={t.landing.feature1Title}
            body={t.landing.feature1Body}
          />
          <Feature
            title={t.landing.feature2Title}
            body={t.landing.feature2Body}
          />
          <Feature
            title={t.landing.feature3Title}
            body={t.landing.feature3Body}
          />
          <Feature
            title={t.landing.feature4Title}
            body={t.landing.feature4Body}
          />
        </ul>
      </section>

      <footer className="mx-auto max-w-3xl px-5 py-10 text-xs text-muted">
        © {new Date().getFullYear()} {t.landing.footer}
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <li className="rounded-[var(--radius-lg)] border border-line bg-panel/70 px-5 py-4">
      <p className="font-bold text-accent-strong">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-text/80">{body}</p>
    </li>
  );
}
