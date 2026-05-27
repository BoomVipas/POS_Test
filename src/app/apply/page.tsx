import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ApplyForm } from "./Form";
import { getDict } from "@/lib/i18n/server";

export default async function ApplyPage() {
  const { t } = await getDict();
  const a = t.apply;

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3">
          <Link href="/" className="shrink-0" aria-label="Mochi POS home">
            <Image
              src="/mochi-wordmark.png"
              alt="Mochi POS"
              width={150}
              height={34}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="ml-4 hidden items-center gap-5 text-sm font-bold text-muted md:flex">
            <a href="#features" className="hover:text-accent-strong">
              {a.navFeatures}
            </a>
            <a href="#how-it-works" className="hover:text-accent-strong">
              {a.navHowItWorks}
            </a>
            <a href="#faq" className="hover:text-accent-strong">
              {a.navFaq}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden rounded-[var(--radius-md)] px-3 py-2 text-sm font-bold text-text hover:bg-soft sm:inline-flex"
            >
              {a.navSignIn}
            </Link>
            <a
              href="#apply"
              className="btn-accent inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-sm font-extrabold"
            >
              {a.heroCtaPrimary}
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 pb-14 pt-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:pb-20 lg:pt-16">
        <div>
          <Link
            href="/"
            className="mb-5 inline-flex h-10 items-center rounded-[var(--radius-md)] border border-line bg-panel px-4 text-sm font-extrabold text-accent-strong shadow-[var(--shadow-rest)] hover:bg-soft"
          >
            {a.backToHome}
          </Link>
          <h1 className="font-display text-5xl font-black leading-[0.98] tracking-tight text-accent-strong sm:text-6xl">
            {a.heroHeadline}
          </h1>
          <p className="mt-5 max-w-xl text-2xl font-extrabold leading-tight text-[var(--lavender-700)]">
            {a.heroSubheadline}
          </p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-text/85">
            {a.heroBody}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#apply"
              className="btn-accent inline-flex items-center rounded-[var(--radius-md)] px-6 py-3 text-base font-extrabold"
            >
              {a.heroCtaPrimary}
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-[var(--radius-md)] border border-line bg-panel px-5 py-3 text-sm font-extrabold text-accent-strong shadow-[var(--shadow-rest)]"
            >
              {a.heroCtaSecondary}
            </a>
          </div>
          <p className="mt-4 text-sm font-bold text-muted">
            {a.heroTrustNote}
          </p>
        </div>

        <HeroPreview
          kicker={a.heroPreviewKicker}
          title={a.heroPreviewTitle}
          status={a.heroPreviewStatus}
          today={a.heroPreviewToday}
          footer={a.heroPreviewFooter}
        />
      </section>

      <section className="border-y border-line/70 bg-panel/55">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
              {a.audiencesHeading}
            </h2>
            <p className="mt-3 leading-relaxed text-text/80">
              {a.audiencesBody}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {a.audiences.map((audience) => (
              <li
                key={audience}
                className="rounded-[var(--radius-md)] border border-line bg-panel px-4 py-3 text-sm font-extrabold text-text shadow-[var(--shadow-rest)]"
              >
                {audience}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1180px] px-5 py-14">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
            {a.featuresHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-text/80">
            {a.featuresBody}
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {a.benefits.map((item) => (
            <article
              key={item.title}
              className="rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-[var(--shadow-rest)]"
            >
              <h3 className="font-display text-lg font-black text-accent-strong">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[var(--indigo-50)]">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
            {a.howItWorksHeading}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {a.steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-[var(--shadow-rest)]"
              >
                <div className="num grid h-9 w-9 place-items-center rounded-[12px] bg-[var(--lavender-100)] text-sm font-black text-[var(--lavender-700)]">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-display text-lg font-black text-accent-strong">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-6 px-5 py-14 lg:grid-cols-2">
        <article className="rounded-[var(--radius-xl)] border border-line bg-panel p-7 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
            {a.contactHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-text/80">
            {a.contactBody}
          </p>
          <div className="mt-6 rounded-[var(--radius-lg)] bg-[var(--cream)] p-5">
            <p className="font-extrabold text-accent-strong">
              Visan Chantrapanichkul (VC)
            </p>
            <p className="text-sm text-muted">Product Lead &amp; Sales Executive</p>
            <div className="mt-3 grid gap-2 text-sm font-bold text-text">
              <a href="tel:+66869948580" className="hover:text-accent">
                086-994-8580
              </a>
              <a
                href="mailto:visanchan.c@gmail.com"
                className="hover:text-accent"
              >
                visanchan.c@gmail.com
              </a>
            </div>
          </div>
        </article>

        <article className="rounded-[var(--radius-xl)] border border-line bg-panel p-7 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
            {a.dataHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-text/80">
            {a.dataBody}
          </p>
          <p className="mt-5 text-sm font-bold text-muted">
            {a.dataFootnote}
          </p>
        </article>
      </section>

      <section id="faq" className="border-y border-line/70 bg-panel/55">
        <div className="mx-auto max-w-[900px] px-5 py-14">
          <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
            {a.faqHeading}
          </h2>
          <div className="mt-8 grid gap-3">
            {a.faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-[var(--shadow-rest)]"
              >
                <summary className="cursor-pointer list-none font-display text-lg font-black text-accent-strong">
                  {item.q}
                </summary>
                <p className="mt-3 leading-relaxed text-text/80">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="apply"
        className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_500px]"
      >
        <div>
          <h2 className="font-display text-4xl font-black tracking-tight text-accent-strong">
            {a.applyHeading}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-text/85">
            {a.applyBody}
          </p>
          <div className="mt-8 rounded-[var(--radius-xl)] border border-line bg-panel p-6 shadow-[var(--shadow-rest)]">
            <h3 className="font-display text-xl font-black text-accent-strong">
              {a.applyBoxHeading}
            </h3>
            <p className="mt-2 leading-relaxed text-text/80">
              {a.applyBoxBody}
            </p>
          </div>
        </div>

        <aside className="rounded-[var(--radius-xl)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-display text-2xl font-black text-accent-strong">
            {a.applyAsideHeading}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {a.applyAsideBody}
          </p>
          <div className="mt-6">
            <ApplyForm
              labels={{
                fieldName: a.fieldName,
                fieldPhone: a.fieldPhone,
                fieldEmail: a.fieldEmail,
                fieldBrand: a.fieldBrand,
                fieldCategory: a.fieldCategory,
                fieldSocial: a.fieldSocial,
                fieldNumSkus: a.fieldNumSkus,
                fieldEventsPerYear: a.fieldEventsPerYear,
                fieldMessage: a.fieldMessage,
                fieldMessagePlaceholder: a.fieldMessagePlaceholder,
                submit: a.submit,
                submitting: a.submitting,
                alreadyApproved: a.alreadyApproved,
                redeemInvite: a.redeemInvite,
              }}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}

function HeroPreview({
  kicker,
  title,
  status,
  today,
  footer,
}: {
  kicker: string;
  title: string;
  status: string;
  today: string;
  footer: string;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-panel p-4 shadow-[var(--shadow-card)]">
      <div className="rounded-[22px] bg-[var(--indigo-50)] p-4">
        <div className="rounded-[20px] border border-line bg-panel p-4 shadow-[var(--shadow-rest)]">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">
                {kicker}
              </p>
              <p className="mt-1 font-display text-xl font-black text-accent-strong">
                {title}
              </p>
            </div>
            <div className="rounded-[12px] bg-[var(--lavender-100)] px-3 py-2 text-xs font-black text-[var(--lavender-700)]">
              {status}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
            <div className="grid gap-2">
              {["SKU-101 Tote Bag", "SKU-214 Candle Set", "SKU-330 Gift Card"].map(
                (label, index) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[14px] border border-line bg-panel-strong px-3 py-3"
                  >
                    <span className="text-sm font-extrabold text-text">
                      {label}
                    </span>
                    <span className="num text-sm font-black text-accent-strong">
                      THB {[590, 390, 100][index]}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className="rounded-[16px] bg-[var(--color-accent)] p-4 text-white">
              <p className="text-xs font-bold text-white/70">{today}</p>
              <p className="num mt-2 text-3xl font-black">THB 12,840</p>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                {footer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
