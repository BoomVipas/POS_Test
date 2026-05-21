"use client";

import { Fragment, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { formatTHB } from "@/lib/money/format";

// Net-new onboarding wizard from screens/onboarding.html. Five steps with a
// real client-side state machine + per-step validation. The Products step is
// wired to the live demo catalog; the rest hold their values in memory.
// Creating the account / workspace / event for real lands when Supabase auth +
// the events model do — until then "Finish" drops the user into /app. We never
// persist the password to localStorage (security), so wizard fields reset on
// refresh by design.

const STEPS = ["Code", "Account", "Brand", "Products", "First event"] as const;

const SUBTITLE = [
  "Invite code",
  "Your account",
  "Your brand",
  "Your products",
  "Your first event",
];

const HEADING = [
  "Redeem your invite",
  "Create your account",
  "Set up your brand",
  "Add your products",
  "Create your first event",
];

const LEDE = [
  "Enter the code from your approval message to claim your pilot seat.",
  "This is how you sign in to MochiPOS — we keep it to the essentials.",
  "Your booth name, payment handle, and logo — what customers see on the receipt.",
  "Add SKUs one at a time or bulk-import. Aim for ~30 in under 30 minutes — you can stop and come back anytime.",
  "Set up the event you are selling at first. MochiPOS allocates stock per day across a multi-day booth.",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "w-full rounded-[12px] border border-line bg-panel px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-[var(--indigo-500)] focus:ring-4 focus:ring-[var(--lavender-200)]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function OnboardingClient() {
  const router = useRouter();
  const { items, ready } = useDemoCatalog();
  const products = items.slice(0, 8);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [account, setAccount] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [brand, setBrand] = useState({ name: "", promptpay: "", phone: "" });
  const [evt, setEvt] = useState({ name: "", start: "", end: "", location: "" });

  const firstName = account.fullName.trim().split(/\s+/)[0] ?? "";
  const brandLabel = brand.name.trim() || "your booth";
  const isLast = step === STEPS.length - 1;
  const canSkip = step === 3 || step === 4;

  function validate(s: number): string | null {
    switch (s) {
      case 0:
        return code.trim().length >= 4
          ? null
          : "Enter the invite code from your approval message.";
      case 1:
        if (!account.fullName.trim()) return "Your name helps us address you.";
        if (!EMAIL_RE.test(account.email.trim()))
          return "Enter a valid email — it is your sign-in.";
        if (account.password.length < 8)
          return "Use at least 8 characters for your password.";
        return null;
      case 2:
        return brand.name.trim()
          ? null
          : "Give your booth a name — it shows on the receipt.";
      case 4:
        if (evt.start && evt.end && evt.end < evt.start)
          return "The end date cannot be before the start date.";
        return null;
      default:
        return null;
    }
  }

  function goNext() {
    const err = validate(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/app");
  }

  function goBack() {
    setError(null);
    if (step > 0) setStep(step - 1);
  }

  function goSkip() {
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/app");
  }

  function jumpTo(i: number) {
    if (i < step) {
      setError(null);
      setStep(i);
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="mt-6 flex flex-col gap-6">
            <div
              className="flex items-center gap-3.5 rounded-2xl border p-4"
              style={{ background: "var(--cream)", borderColor: "var(--color-line)" }}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-panel">
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
              </span>
              <div>
                <div className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-muted">
                  Pilot invite
                </div>
                <div className="mt-0.5 text-sm font-bold text-text">
                  Approved · 5-brand pilot cohort
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
                Invite code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MOCHI-XXXX"
                autoComplete="off"
                className="w-full rounded-[14px] border border-line bg-panel px-4 py-4 text-center font-mono text-2xl font-extrabold tracking-[0.12em] text-text outline-none transition placeholder:text-muted/40 focus:border-[var(--indigo-500)] focus:ring-4 focus:ring-[var(--lavender-200)]"
              />
              <span className="mt-2 block text-xs text-muted">
                Find this in your approval email or LINE message from MochiPOS.
              </span>
            </label>
          </div>
        );

      case 1:
        return (
          <div className="mt-6 flex flex-col gap-5">
            <Field label="Full name">
              <input
                className={inputCls}
                value={account.fullName}
                onChange={(e) =>
                  setAccount({ ...account, fullName: e.target.value })
                }
                placeholder="Aim Saetang"
                autoComplete="name"
              />
            </Field>
            <Field label="Email" hint="This is your sign-in — use one you check.">
              <input
                type="email"
                className={inputCls}
                value={account.email}
                onChange={(e) =>
                  setAccount({ ...account, email: e.target.value })
                }
                placeholder="you@brand.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <input
                type="password"
                className={inputCls}
                value={account.password}
                onChange={(e) =>
                  setAccount({ ...account, password: e.target.value })
                }
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <p className="text-xs text-muted">
              Google sign-in arrives at launch. For the pilot, a password keeps
              you moving.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="mt-6 flex flex-col gap-5">
            <Field
              label="Booth / brand name"
              hint="Shows on receipts and the customer pet-profile page."
            >
              <input
                className={inputCls}
                value={brand.name}
                onChange={(e) => setBrand({ ...brand, name: e.target.value })}
                placeholder="Meow House"
                autoComplete="organization"
              />
            </Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="PromptPay ID">
                <input
                  className={inputCls}
                  value={brand.promptpay}
                  onChange={(e) =>
                    setBrand({ ...brand, promptpay: e.target.value })
                  }
                  placeholder="0xx-xxx-xxxx"
                  inputMode="tel"
                />
              </Field>
              <Field label="Contact phone">
                <input
                  className={inputCls}
                  value={brand.phone}
                  onChange={(e) => setBrand({ ...brand, phone: e.target.value })}
                  placeholder="0xx-xxx-xxxx"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
            </div>
            <div
              className="flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-line p-4"
              style={{ background: "var(--color-soft)" }}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-panel">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </span>
              <div>
                <div className="text-sm font-extrabold text-text">
                  Logo upload
                </div>
                <div className="text-xs text-muted">
                  Arrives with image storage — your initials stand in until then.
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="mt-6 grid gap-3">
            {ready &&
              products.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[48px_1fr_auto] items-center gap-4 rounded-2xl p-3.5 sm:grid-cols-[48px_1fr_auto_auto]"
                  style={{ background: "var(--color-soft)" }}
                >
                  <div
                    className="grid h-12 w-12 place-items-center rounded-xl text-base font-extrabold"
                    style={{
                      background: "var(--color-panel)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {p.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-extrabold text-text">
                      {p.name}
                    </div>
                    <div className="num text-[11px] font-bold text-muted">
                      {p.sku}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted">
                      Price
                    </div>
                    <div className="num text-[13px] font-extrabold text-text">
                      ฿{formatTHB(p.price_satang)}
                    </div>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="text-right">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted">
                        Stock
                      </div>
                      <div className="num text-[13px] font-extrabold text-text">
                        {p.current_qty}
                      </div>
                    </div>
                    {p.send_later_enabled && (
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-bold"
                        style={{
                          background: "var(--lavender-100)",
                          color: "var(--color-accent)",
                        }}
                      >
                        Send Later
                      </span>
                    )}
                  </div>
                </div>
              ))}

            {ready && products.length === 0 && (
              <p
                className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted"
                style={{ background: "var(--color-soft)" }}
              >
                No products yet — add your first in the catalog manager.
              </p>
            )}

            <Link
              href="/app/setup/products"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-line p-4 transition hover:bg-[var(--lavender-100)]"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl text-xl font-bold"
                style={{
                  background: "var(--color-panel)",
                  color: "var(--color-accent)",
                }}
              >
                +
              </span>
              <span>
                <span className="block text-sm font-extrabold text-text">
                  Add products
                </span>
                <span className="block text-xs text-muted">
                  Opens the catalog manager in a new tab · this list updates live
                </span>
              </span>
            </Link>
          </div>
        );

      case 4:
        return (
          <div className="mt-6 flex flex-col gap-5">
            <Field label="Event name">
              <input
                className={inputCls}
                value={evt.name}
                onChange={(e) => setEvt({ ...evt, name: e.target.value })}
                placeholder="Pet Expo Thailand 2026"
              />
            </Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Starts">
                <input
                  type="date"
                  className={inputCls}
                  value={evt.start}
                  onChange={(e) => setEvt({ ...evt, start: e.target.value })}
                />
              </Field>
              <Field label="Ends">
                <input
                  type="date"
                  className={inputCls}
                  value={evt.end}
                  onChange={(e) => setEvt({ ...evt, end: e.target.value })}
                />
              </Field>
            </div>
            <Field
              label="Location / booth"
              hint="Optional — handy when you run several events."
            >
              <input
                className={inputCls}
                value={evt.location}
                onChange={(e) => setEvt({ ...evt, location: e.target.value })}
                placeholder="Hall 5 · Booth C-12"
              />
            </Field>
            <div
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: "var(--indigo-50)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
                aria-hidden
              >
                <rect x="3" y="4" width="18" height="17" rx="3" />
                <path d="M3 9h18M8 2v4M16 2v4" />
              </svg>
              <p className="text-[13px] leading-relaxed text-text">
                MochiPOS allocates stock <strong>per day</strong> across a
                multi-day event, with a separate sample bucket and Send-Later
                orders that ship from the warehouse — the workflow proven at a
                real 4-day Pet Expo booth.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <main className="min-h-dvh">
      {/* Topbar */}
      <header className="mx-auto flex max-w-[1200px] items-center gap-3.5 border-b border-line px-6 py-3.5 sm:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-display text-lg font-extrabold tracking-tight text-accent">
            Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
          </span>
        </Link>
        <div className="ml-auto text-xs text-muted">
          Stuck?{" "}
          <Link href="/" className="font-bold text-accent">
            LINE us
          </Link>{" "}
          ·{" "}
          <Link href="/login" className="font-bold text-accent">
            Sign out
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[920px] px-6 pb-20 pt-10 sm:px-7">
        {/* Progress rail */}
        <div className="mb-9 flex items-center gap-3">
          {STEPS.map((s, i) => {
            const done = i < step;
            const on = i === step;
            return (
              <Fragment key={s}>
                {i > 0 && (
                  <div
                    className="h-0.5 flex-1 rounded"
                    style={{
                      background:
                        i <= step
                          ? "var(--color-ok-soft-fg)"
                          : "var(--color-soft)",
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-disabled={!done}
                  className={`flex items-center gap-2.5 rounded-full ${
                    done ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold"
                    style={
                      done
                        ? {
                            background: "var(--color-ok-soft-bg)",
                            color: "var(--color-ok-soft-fg)",
                          }
                        : on
                          ? {
                              background: "var(--color-accent)",
                              color: "#fff",
                              boxShadow: "0 0 0 4px var(--lavender-200)",
                            }
                          : {
                              background: "var(--color-soft)",
                              color: "var(--color-muted)",
                            }
                    }
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className="hidden text-[12px] font-extrabold uppercase tracking-[0.04em] sm:inline"
                    style={{
                      color:
                        i <= step ? "var(--color-text)" : "var(--color-muted)",
                    }}
                  >
                    {s}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            goNext();
          }}
          className="rounded-[24px] border border-line bg-panel p-7 shadow-[var(--shadow-card)] sm:p-10"
        >
          {/* Welcome */}
          <div
            className="mb-7 flex items-center gap-3.5 rounded-2xl p-4"
            style={{ background: "var(--lavender-100)" }}
          >
            <Image
              src="/mochi-mascot.png"
              alt=""
              width={38}
              height={38}
              className="h-9 w-9 object-contain"
            />
            <div>
              <div className="text-sm font-extrabold text-accent">
                Welcome{firstName ? `, ${firstName}` : ""} 👋
              </div>
              <div className="mt-0.5 text-xs text-text">
                Your invite is approved — let&apos;s set up {brandLabel} so you
                can start selling.
              </div>
            </div>
          </div>

          <div
            className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: "var(--lavender-700)" }}
          >
            Step {step + 1} of {STEPS.length} · {SUBTITLE[step]}
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-text">
            {HEADING[step]}
          </h1>
          <p className="mt-2 max-w-[540px] text-[15px] leading-relaxed text-muted">
            {LEDE[step]}
          </p>

          {renderStep()}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: "var(--color-danger-soft-bg)",
                color: "var(--color-danger-soft-fg)",
              }}
            >
              {error}
            </p>
          )}

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-[14px] border border-line bg-panel px-5 py-3.5 text-sm font-bold text-accent transition hover:bg-soft"
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              className="rounded-[14px] px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
              style={{ background: "var(--grad-primary)" }}
            >
              {isLast ? "Finish · open my POS →" : `Next: ${STEPS[step + 1]} →`}
            </button>
            {canSkip && (
              <button
                type="button"
                onClick={goSkip}
                className="ml-auto text-[13px] font-bold text-muted hover:text-accent"
              >
                {isLast ? "Skip · finish setup" : "Skip · I’ll add later"}
              </button>
            )}
          </div>
        </form>

        {step === 3 && (
          <p className="mt-6 text-center text-xs text-muted">
            {ready ? products.length : 0} product
            {products.length === 1 ? "" : "s"} · saved automatically ·{" "}
            <Link href="/app/setup/products" className="font-bold text-accent">
              view all
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
