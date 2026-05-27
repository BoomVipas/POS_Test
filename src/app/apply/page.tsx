import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ApplyForm } from "./Form";

const AUDIENCES = [
  "Product booth sellers",
  "Pop-up store owners",
  "Event sellers",
  "Small retail brands",
  "Small brands preparing for multi-day events",
];

const BENEFITS = [
  {
    title: "Fast checkout",
    body: "Ring up orders quickly on a tablet or laptop, even when the booth gets busy.",
  },
  {
    title: "Easy stock",
    body: "Track event stock, samples, and restock adjustments without paper notes.",
  },
  {
    title: "Clear reports",
    body: "See daily sales, payment methods, and event summaries after each selling day.",
  },
  {
    title: "Product setup",
    body: "Manage products, SKU, price, and starting stock before the event opens.",
  },
  {
    title: "QR payment support",
    body: "Built for QR and PromptPay-friendly sales workflows.",
  },
];

const STEPS = [
  {
    title: "Apply or try the demo",
    body: "Tell us about your brand and upcoming event. We review early access by hand.",
  },
  {
    title: "Set up products and stock",
    body: "Add products, SKU, prices, and starting stock for each event.",
  },
  {
    title: "Sell at the booth",
    body: "Use the POS to record sales, payment type, samples, and corrections.",
  },
  {
    title: "Close the day",
    body: "Review sales, cash, and stock movement before the team goes home.",
  },
];

const FAQS = [
  {
    q: "Is Mochi POS free to try?",
    a: "Early access is reviewed case by case. Apply and we will contact you with the current pilot details.",
  },
  {
    q: "What device do I need?",
    a: "A tablet or laptop with internet access works best.",
  },
  {
    q: "Can it support QR payment?",
    a: "Yes. Mochi POS is designed for QR and PromptPay-friendly sales workflows.",
  },
  {
    q: "Can I use it for a multi-day event?",
    a: "Yes. The workflow supports event stock and daily reporting.",
  },
  {
    q: "Do I need technical setup?",
    a: "No. We help early users get started and understand the setup.",
  },
  {
    q: "Who will support me?",
    a: "VC is the contact person for early access and setup questions.",
  },
];

export default function ApplyPage() {
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
              Features
            </a>
            <a href="#how-it-works" className="hover:text-accent-strong">
              How it works
            </a>
            <a href="#faq" className="hover:text-accent-strong">
              FAQ
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden rounded-[var(--radius-md)] px-3 py-2 text-sm font-bold text-text hover:bg-soft sm:inline-flex"
            >
              Sign in
            </Link>
            <a
              href="#apply"
              className="btn-accent inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-sm font-extrabold"
            >
              Try Demo / Apply
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
            Back to home
          </Link>
          <h1 className="font-display text-5xl font-black leading-[0.98] tracking-tight text-accent-strong sm:text-6xl">
            Simple POS for pop-up sellers
          </h1>
          <p className="mt-5 max-w-xl text-2xl font-extrabold leading-tight text-[var(--lavender-700)]">
            Fast Sales. Easy Stock. Clear Reports.
          </p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-text/85">
            Sell faster at events, track stock clearly, and close each selling
            day with reports you can trust.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#apply"
              className="btn-accent inline-flex items-center rounded-[var(--radius-md)] px-6 py-3 text-base font-extrabold"
            >
              Try Demo / Apply
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-[var(--radius-md)] border border-line bg-panel px-5 py-3 text-sm font-extrabold text-accent-strong shadow-[var(--shadow-rest)]"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm font-bold text-muted">
            Early access is reviewed by a real person. We help you get set up.
          </p>
        </div>

        <HeroPreview />
      </section>

      <section className="border-y border-line/70 bg-panel/55">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
              Built for small brands selling in real places
            </h2>
            <p className="mt-3 leading-relaxed text-text/80">
              Mochi POS is for sellers who need a practical booth system, not a
              complicated enterprise setup.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((audience) => (
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
            Everything a small event seller needs to run the booth
          </h2>
          <p className="mt-3 leading-relaxed text-text/80">
            Keep checkout, stock, and reporting in one simple workflow your team
            can understand quickly.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {BENEFITS.map((item) => (
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
            How it works
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((step, index) => (
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
            You are not setting this up alone
          </h2>
          <p className="mt-3 leading-relaxed text-text/80">
            Mochi POS is currently open to selected early users. We review each
            application, help set up the first workspace, and collect feedback
            to improve the product before wider launch.
          </p>
          <div className="mt-6 rounded-[var(--radius-lg)] bg-[var(--cream)] p-5">
            <p className="font-extrabold text-accent-strong">
              Visan Chantrapanichkul (VC)
            </p>
            <p className="text-sm text-muted">Product Lead & Sales Executive</p>
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
            Your sales data stays your business data
          </h2>
          <p className="mt-3 leading-relaxed text-text/80">
            Mochi POS uses workspace-based access so each seller only sees their
            own products, orders, stock, and reports. We use your application
            information to review your pilot request and contact you about
            setup. We do not sell your customer or sales data.
          </p>
          <p className="mt-5 text-sm font-bold text-muted">
            Simple promise: practical access control, careful handling, and no
            exaggerated enterprise claims.
          </p>
        </article>
      </section>

      <section id="faq" className="border-y border-line/70 bg-panel/55">
        <div className="mx-auto max-w-[900px] px-5 py-14">
          <h2 className="font-display text-3xl font-black tracking-tight text-accent-strong">
            Questions before you try Mochi POS
          </h2>
          <div className="mt-8 grid gap-3">
            {FAQS.map((item) => (
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
            Apply for early access
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-text/85">
            Tell us about your brand, products, and upcoming events. We will
            review your application and contact you about the next step.
          </p>
          <div className="mt-8 rounded-[var(--radius-xl)] border border-line bg-panel p-6 shadow-[var(--shadow-rest)]">
            <h3 className="font-display text-xl font-black text-accent-strong">
              Early access, with hands-on support
            </h3>
            <p className="mt-2 leading-relaxed text-text/80">
              You do not need to be technical. We will help you understand the
              setup and decide whether Mochi POS fits your event workflow.
            </p>
          </div>
        </div>

        <aside className="rounded-[var(--radius-xl)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-display text-2xl font-black text-accent-strong">
            Start your application
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We review every application by hand. Expect a reply within 3 working
            days.
          </p>
          <div className="mt-6">
            <ApplyForm />
          </div>
        </aside>
      </section>
    </main>
  );
}

function HeroPreview() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-panel p-4 shadow-[var(--shadow-card)]">
      <div className="rounded-[22px] bg-[var(--indigo-50)] p-4">
        <div className="rounded-[20px] border border-line bg-panel p-4 shadow-[var(--shadow-rest)]">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">
                Event checkout
              </p>
              <p className="mt-1 font-display text-xl font-black text-accent-strong">
                Booth POS
              </p>
            </div>
            <div className="rounded-[12px] bg-[var(--lavender-100)] px-3 py-2 text-xs font-black text-[var(--lavender-700)]">
              Running
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
              <p className="text-xs font-bold text-white/70">Today</p>
              <p className="num mt-2 text-3xl font-black">THB 12,840</p>
              <p className="mt-3 text-xs leading-relaxed text-white/75">
                Stock, cash, QR, and daily close in one flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
