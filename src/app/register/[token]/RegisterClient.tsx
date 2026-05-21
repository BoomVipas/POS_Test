"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDemoCustomerTokens } from "@/lib/demo/useDemoCustomerTokens";
import { RegisterFormSchema, type RegisterFormValues } from "./schema";
import type {
  ClaimPayload,
  DemoPortalContact,
  DemoPortalPet,
} from "@/lib/demo/customer-tokens";

const SPECIES = [
  { v: "cat", label: "Cat", emoji: "🐱" },
  { v: "dog", label: "Dog", emoji: "🐶" },
  { v: "rabbit", label: "Rabbit", emoji: "🐰" },
  { v: "bird", label: "Bird", emoji: "🐦" },
  { v: "other", label: "Other", emoji: "🐾" },
] as const;

const fieldCls =
  "w-full rounded-[14px] border border-line bg-panel px-4 py-3.5 text-base text-text outline-none transition placeholder:text-muted/60 focus:border-[var(--indigo-500)] focus:ring-4 focus:ring-[var(--lavender-200)]";
const labelCls =
  "mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted";

/** Mobile phone-frame shell (pet-portal mockup is 390px-wide, customer-facing). */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col">
      {children}
    </main>
  );
}

function PortalTopbar() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <Image
        src="/mochi-mascot.png"
        alt=""
        width={24}
        height={24}
        className="h-6 w-6 object-contain"
      />
      <span className="font-display text-base font-extrabold tracking-tight text-accent">
        Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
      </span>
    </div>
  );
}

export function RegisterClient({ token }: { token: string }) {
  const { ready, validate, claim } = useDemoCustomerTokens();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<RegisterFormValues>({
    displayName: "",
    preferredContactMethod: null,
    consentMarketing: false,
    phone: "",
    email: "",
    lineId: "",
    pet: {
      name: "",
      species: "cat",
      breed: "",
      birthday: "",
      allergies: "",
      preferences: "",
    },
  });

  // Validate token at mount + whenever the demo store updates.
  const validation = useMemo(() => {
    if (!ready) return null;
    return validate(token);
  }, [ready, token, validate]);

  if (!ready) {
    return (
      <Shell>
        <PortalTopbar />
        <div className="grid flex-1 place-items-center px-5 text-sm text-muted">
          Loading…
        </div>
      </Shell>
    );
  }

  if (validation && !validation.ok) {
    const message =
      validation.reason === "token-not-found"
        ? "We can't find this registration link. Ask the booth staff for a new one."
        : validation.reason === "token-already-claimed"
          ? "This link has already been used. Thanks — your info is saved."
          : "This link has expired. Ask the booth staff for a new one.";
    return (
      <Shell>
        <PortalTopbar />
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <div
            className="mb-4 grid h-20 w-20 place-items-center rounded-[28px]"
            style={{ background: "var(--lavender-100)" }}
          >
            <Image
              src="/mochi-mascot.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-auto object-contain opacity-60"
            />
          </div>
          <h1 className="font-display text-2xl font-black text-text">
            Link unavailable
          </h1>
          <p className="mt-3 text-sm text-muted">{message}</p>
          <Link
            href="/"
            className="mt-5 rounded-[14px] border border-line bg-panel px-5 py-2.5 text-sm font-bold text-accent"
          >
            Home
          </Link>
        </div>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell>
        <PortalTopbar />
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <div
            className="mb-4 grid h-20 w-20 place-items-center rounded-full"
            style={{ background: "var(--color-ok-soft-bg)" }}
          >
            <span
              className="text-3xl"
              style={{ color: "var(--color-ok-soft-fg)" }}
            >
              ✓
            </span>
          </div>
          <h1 className="font-display text-2xl font-black text-text">
            Saved! / บันทึกแล้ว
          </h1>
          <p className="mt-3 text-sm text-muted">
            We&apos;ve linked your info to this order — we&apos;ll only reach out
            if you opted in.
          </p>
          <p className="mt-1 text-sm text-muted">
            ขอบคุณ — เราเก็บข้อมูลคุณไว้แล้ว
          </p>
        </div>
      </Shell>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const parsed = RegisterFormSchema.safeParse(values);
    if (!parsed.success) {
      setSubmitError("Please check the highlighted fields.");
      return;
    }
    const v = parsed.data;
    const contacts: DemoPortalContact[] = [];
    if (v.phone)
      contacts.push({ channel: "phone", value: v.phone, isPrimary: true });
    if (v.email)
      contacts.push({
        channel: "email",
        value: v.email,
        isPrimary: contacts.length === 0,
      });
    if (v.lineId)
      contacts.push({
        channel: "line",
        value: v.lineId,
        isPrimary: contacts.length === 0,
      });

    const pets: DemoPortalPet[] = [];
    if (v.pet?.name && v.pet.name.trim()) {
      pets.push({
        name: v.pet.name,
        species: v.pet.species,
        ...(v.pet.breed ? { breed: v.pet.breed } : {}),
        ...(v.pet.birthday ? { birthday: v.pet.birthday } : {}),
        ...(v.pet.allergies ? { allergies: v.pet.allergies } : {}),
        ...(v.pet.preferences ? { preferences: v.pet.preferences } : {}),
      });
    }

    const payload: ClaimPayload = {
      displayName: v.displayName ?? null,
      preferredContactMethod: v.preferredContactMethod ?? null,
      consentMarketing: Boolean(v.consentMarketing),
      contacts,
      pets,
    };

    setSubmitting(true);
    try {
      const result = claim(token, payload);
      if (result.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(
          result.reason === "token-already-claimed"
            ? "This link has already been used."
            : result.reason === "token-expired"
              ? "This link has expired."
              : "Sorry, this link is invalid.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function update<K extends keyof RegisterFormValues>(
    key: K,
    val: RegisterFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function updatePet<K extends keyof NonNullable<RegisterFormValues["pet"]>>(
    key: K,
    val: NonNullable<RegisterFormValues["pet"]>[K],
  ) {
    setValues((prev) => ({
      ...prev,
      pet: { ...prev.pet!, [key]: val },
    }));
  }

  return (
    <Shell>
      <PortalTopbar />

      {/* Hero */}
      <div
        className="px-5 pb-7 pt-2 text-center"
        style={{
          background:
            "linear-gradient(180deg, var(--color-bg-grad-from) 0%, var(--color-bg-grad-to) 100%)",
        }}
      >
        <div
          className="mx-auto mb-4 grid h-[112px] w-[112px] place-items-center rounded-[36px] p-3 shadow-[var(--shadow-card)]"
          style={{ background: "var(--lavender-100)" }}
        >
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={88}
            height={88}
            className="h-full w-auto object-contain"
          />
        </div>
        <h1 className="font-display text-[26px] font-black leading-tight text-text">
          Tell us about your pet
        </h1>
        <p className="mt-2 px-2 text-sm text-muted">
          So next time you visit, we&apos;ll remember your pet — and only show
          what they&apos;ll love.
        </p>
        <p className="mt-1 px-2 text-sm text-muted">
          กรอกเฉพาะข้อมูลที่อยากให้ร้านรู้ ส่วนอื่นเว้นว่างได้
        </p>
        <span
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.04em] text-text"
          style={{ background: "var(--cream)" }}
        >
          🐾 Registration{" "}
          <span className="num font-bold" style={{ letterSpacing: 0 }}>
            {token.slice(0, 8)}…
          </span>
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col">
        <div className="grid gap-6 px-5 py-6">
          {/* About you */}
          <section>
            <div
              className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.04em]"
              style={{ color: "var(--lavender-700)" }}
            >
              About you
            </div>
            <h3 className="mb-4 font-display text-lg font-extrabold text-text">
              Where can we reach you?
            </h3>
            <div className="grid gap-3.5">
              <div>
                <label className={labelCls} htmlFor="displayName">
                  Name or nickname / ชื่อ
                </label>
                <input
                  id="displayName"
                  className={fieldCls}
                  value={values.displayName ?? ""}
                  onChange={(e) => update("displayName", e.target.value)}
                  maxLength={80}
                  autoComplete="name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="phone">
                    Phone / เบอร์โทร
                  </label>
                  <input
                    id="phone"
                    className={fieldCls}
                    value={values.phone ?? ""}
                    onChange={(e) => update("phone", e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="lineId">
                    Line ID
                  </label>
                  <input
                    id="lineId"
                    className={fieldCls}
                    value={values.lineId ?? ""}
                    onChange={(e) => update("lineId", e.target.value)}
                    maxLength={80}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={fieldCls}
                  value={values.email ?? ""}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
          </section>

          {/* Your pet */}
          <section>
            <h3 className="font-display text-lg font-extrabold text-text">
              Your pet{" "}
              <span className="text-xs font-bold text-muted">
                / สัตว์เลี้ยง · optional
              </span>
            </h3>
            <p className="mb-4 mt-1 text-[13px] text-muted">
              Skip if you&apos;d rather not — we&apos;ll remember whatever you
              share.
            </p>
            <div className="grid gap-3.5">
              <div>
                <label className={labelCls} htmlFor="petName">
                  Pet name / ชื่อ
                </label>
                <input
                  id="petName"
                  className={fieldCls}
                  value={values.pet?.name ?? ""}
                  onChange={(e) => updatePet("name", e.target.value)}
                  maxLength={40}
                />
              </div>
              <div>
                <label className={labelCls}>Type / ชนิด</label>
                <div className="grid grid-cols-5 gap-2">
                  {SPECIES.map((s) => {
                    const on = (values.pet?.species ?? "cat") === s.v;
                    return (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => updatePet("species", s.v)}
                        aria-pressed={on}
                        className="rounded-[14px] border px-1 py-2.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        style={
                          on
                            ? {
                                borderColor: "var(--color-accent)",
                                background: "var(--indigo-50)",
                              }
                            : {
                                borderColor: "var(--color-line)",
                                background: "var(--color-panel)",
                              }
                        }
                      >
                        <div className="text-xl leading-none">{s.emoji}</div>
                        <div
                          className="mt-1 text-[10px] font-bold"
                          style={{
                            color: on
                              ? "var(--color-accent)"
                              : "var(--color-text)",
                          }}
                        >
                          {s.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="petBreed">
                    Breed / สายพันธุ์
                  </label>
                  <input
                    id="petBreed"
                    className={fieldCls}
                    value={values.pet?.breed ?? ""}
                    onChange={(e) => updatePet("breed", e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="petBirthday">
                    Birthday / วันเกิด
                  </label>
                  <input
                    id="petBirthday"
                    type="date"
                    className={fieldCls}
                    value={values.pet?.birthday ?? ""}
                    onChange={(e) => updatePet("birthday", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="petAllergies">
                  Allergies / แพ้อะไร
                </label>
                <input
                  id="petAllergies"
                  className={fieldCls}
                  placeholder="e.g. chicken, fish"
                  value={values.pet?.allergies ?? ""}
                  onChange={(e) => updatePet("allergies", e.target.value)}
                  maxLength={200}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="petPreferences">
                  Loves / ของโปรด
                </label>
                <input
                  id="petPreferences"
                  className={fieldCls}
                  placeholder="e.g. catnip, tunnels"
                  value={values.pet?.preferences ?? ""}
                  onChange={(e) => updatePet("preferences", e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
          </section>

          {/* Consent */}
          <label
            className="flex items-start gap-3 rounded-[14px] p-4"
            style={{ background: "var(--color-soft)" }}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-[18px] w-[18px]"
              style={{ accentColor: "var(--color-accent)" }}
              checked={Boolean(values.consentMarketing)}
              onChange={(e) => update("consentMarketing", e.target.checked)}
            />
            <span className="text-[13px] leading-relaxed text-text">
              <strong className="font-extrabold">Send me occasional</strong>{" "}
              product picks based on my pet — no spam. / ยินยอมให้ส่งข่าวสารโปรโมชั่นในอนาคต
            </span>
          </label>

          {submitError && (
            <p
              className="rounded-[14px] p-3 text-sm font-bold"
              style={{
                background: "var(--color-danger-soft-bg)",
                color: "var(--color-danger-soft-fg)",
              }}
            >
              {submitError}
            </p>
          )}
        </div>

        {/* Sticky CTA */}
        <div
          className="sticky bottom-0 mt-auto border-t px-5 py-4"
          style={{
            borderColor: "var(--color-line)",
            background:
              "linear-gradient(180deg, transparent 0, var(--color-bg) 35%)",
          }}
        >
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[16px] py-4 text-base font-extrabold text-white shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 disabled:opacity-60"
            style={{ background: "var(--grad-primary)" }}
          >
            {submitting ? "Saving…" : "Save profile →"}
          </button>
          <p className="mt-2.5 text-center text-[11px] text-muted">
            Takes 30 seconds · you can edit anytime
          </p>
        </div>
      </form>
    </Shell>
  );
}
