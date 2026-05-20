import Image from "next/image";
import { getDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ApplyForm } from "./Form";

export default async function ApplyPage() {
  const { t } = await getDict();
  return (
    <main className="flex-1">
      {/* Top bar — wordmark + lang switcher */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-5">
        <a href="/" className="flex items-center gap-2.5">
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="wm text-lg">
            Mochi<span className="pos">POS</span>
          </span>
        </a>
        <LanguageSwitcher />
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-gold)]">
          {t.apply.kicker}
        </p>
        <h1 className="font-display text-[44px] font-black leading-[1.05] tracking-[-0.025em] text-accent-strong">
          {t.apply.title}
        </h1>
        <p className="mt-4 max-w-[34rem] text-[15px] leading-relaxed text-text/80">
          {t.apply.body}
        </p>

        {/* Pilot-fit card — taken from PILOT_RULES */}
        <div className="mt-7 rounded-[var(--radius-lg)] border border-line bg-[color:var(--color-soft)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Best fit for the pilot
          </p>
          <ul className="mt-2.5 grid gap-2 text-[14px] text-text">
            <li className="flex items-start gap-2.5">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>
              Sells at events regularly · ≥ 4 events / year
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>
              ≥ 10 active SKUs — enough to feel real stock pain
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>
              Has repeat customers and uses Send Later / shipping
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>
              Cares about branding and customer relationships
            </li>
          </ul>
        </div>

        <div className="panel mt-7 p-6 sm:p-8">
          <ApplyForm />
        </div>
      </section>
    </main>
  );
}
