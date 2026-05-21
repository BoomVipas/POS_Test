import Link from "next/link";
import Image from "next/image";
import { getDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ApplyForm } from "./Form";

// Pitch enrichment from the apply.html mockup. English for now — flagged for
// Thai translation (owner sign-off), per the i18n rule.
const FEATURES = [
  {
    ti: "Multi-day event stock",
    bd: "Allocate per day, with a separate sample bucket and gift rules baked in.",
  },
  {
    ti: "Send Later, paid now",
    bd: "Customer pays at the booth, ships from the warehouse — stays out of booth stock.",
  },
  {
    ti: "QR pet profiles",
    bd: "The receipt has a QR. The customer registers their pet after the sale, on their phone.",
  },
  {
    ti: "Returning-customer lookup",
    bd: "Phone or QR finds them — past orders, pet name, allergies — at the next event.",
  },
];

export default async function ApplyPage() {
  const { t } = await getDict();
  return (
    <main className="flex-1">
      {/* Public topbar */}
      <header className="mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={30}
            height={30}
            className="h-7 w-7 object-contain"
          />
          <span className="font-display text-lg font-extrabold tracking-tight text-accent">
            Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-bold text-text hover:bg-soft"
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 pb-16 pt-4 lg:grid-cols-[1fr_480px] lg:gap-14">
        {/* LEFT: pitch */}
        <div>
          <p
            className="text-xs font-extrabold uppercase tracking-[0.14em]"
            style={{ color: "var(--lavender-700)" }}
          >
            {t.apply.kicker}
          </p>
          <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-tight text-text sm:text-5xl">
            {t.apply.title}
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-relaxed text-text/85">
            {t.apply.body}
          </p>

          <div className="mt-9 grid max-w-[540px] gap-3.5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.ti}
                className="rounded-2xl border border-line bg-panel p-[18px] shadow-[var(--shadow-card)]"
              >
                <div className="text-sm font-extrabold text-text">{f.ti}</div>
                <div className="mt-1 text-[13px] leading-relaxed text-muted">
                  {f.bd}
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-10 max-w-[540px] rounded-[20px] p-6"
            style={{ background: "var(--cream)" }}
          >
            <p className="font-display text-[13px] italic leading-relaxed text-text">
              &ldquo;Born from a real Pet Expo booth POS that survived a 4-day
              event. Every feature comes from a problem we hit on the booth floor
              — not a spec.&rdquo;
            </p>
            <div className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
              — theMeowseum · Pet Expo Thailand
            </div>
          </div>
        </div>

        {/* RIGHT: form card */}
        <aside className="rounded-[24px] border border-line bg-panel p-7 shadow-[var(--shadow-card)] lg:sticky lg:top-6 lg:h-fit">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-text">
            Apply to join the pilot
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            We review every application by hand. Expect a reply within 3 working
            days.
          </p>
          <div className="mt-5">
            <ApplyForm />
          </div>
        </aside>
      </div>

      {/* Pilot acceptance strip */}
      <div
        className="mx-auto mb-16 flex max-w-[1144px] flex-wrap items-center gap-5 rounded-[20px] px-7 py-5"
        style={{ background: "var(--indigo-50)" }}
      >
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px]"
          style={{ background: "var(--lavender-100)" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div className="min-w-[260px] flex-1">
          <div
            className="text-sm font-extrabold"
            style={{ color: "var(--color-accent)" }}
          >
            Pilot acceptance · 5 brands
          </div>
          <div className="mt-0.5 text-[13px] leading-relaxed text-text">
            Cat-product brand · 10–100 active SKUs · an upcoming event in the
            next 90 days · accepts PromptPay or bank transfer · happy to give
            ~30 min/week of feedback.
          </div>
        </div>
      </div>
    </main>
  );
}
