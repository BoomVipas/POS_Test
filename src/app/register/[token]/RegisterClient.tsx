"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDemoCustomerTokens } from "@/lib/demo/useDemoCustomerTokens";
import { RegisterFormSchema, type RegisterFormValues } from "./schema";
import type {
  ClaimPayload,
  DemoPortalContact,
  DemoPortalPet,
} from "@/lib/demo/customer-tokens";

const SPECIES = [
  { v: "cat", label: "Cat / แมว" },
  { v: "dog", label: "Dog / สุนัข" },
  { v: "rabbit", label: "Rabbit / กระต่าย" },
  { v: "bird", label: "Bird / นก" },
  { v: "other", label: "Other / อื่นๆ" },
] as const;

const fieldCls =
  "w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

const labelCls =
  "block text-xs font-extrabold uppercase tracking-wide text-muted";

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
      <main className="mx-auto max-w-lg px-5 py-12">
        <div className="panel p-6 text-center text-sm text-muted">
          Loading…
        </div>
      </main>
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
      <main className="mx-auto max-w-lg px-5 py-12">
        <div className="panel p-6 text-center">
          <h1 className="font-display text-2xl text-accent-strong">
            Link unavailable
          </h1>
          <p className="mt-3 text-sm text-muted">{message}</p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2 text-sm font-bold text-accent-strong"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-lg px-5 py-12">
        <div className="panel p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-2xl text-[var(--color-ok-soft-fg)]">
            ✓
          </span>
          <h1 className="mt-3 font-display text-2xl text-accent-strong">
            Saved! / บันทึกแล้ว
          </h1>
          <p className="mt-3 text-sm text-muted">
            We&apos;ve linked your info to this order. We&apos;ll only contact
            you if you opted in.
          </p>
          <p className="mt-1 text-sm text-muted">
            ขอบคุณ — เราเก็บข้อมูลคุณไว้แล้ว
          </p>
        </div>
      </main>
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
    <main className="mx-auto max-w-lg px-5 py-8">
      <div className="panel p-6">
        <h1 className="font-display text-2xl text-accent-strong">
          Stay in touch / รับข่าวสาร
        </h1>
        <p className="mt-2 text-sm text-muted">
          Save your info and (optionally) your pet&apos;s profile so the booth
          can recommend better products next time. Skip any field — only the
          consent box matters.
        </p>
        <p className="mt-1 text-sm text-muted">
          กรอกเฉพาะข้อมูลที่อยากให้ร้านรู้ ส่วนอื่นเว้นว่างได้
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-5">
          <fieldset className="grid gap-3">
            <legend className="font-display text-base text-accent-strong">
              You / คุณ
            </legend>
            <div>
              <label className={labelCls} htmlFor="displayName">
                Name / ชื่อ
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
            <div className="grid gap-3 sm:grid-cols-2">
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
                <label className={labelCls} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className={fieldCls}
                  type="email"
                  value={values.email ?? ""}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                />
              </div>
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
            <div>
              <label className={labelCls} htmlFor="contactMethod">
                Best way to reach you / ช่องทางที่สะดวก
              </label>
              <select
                id="contactMethod"
                className={fieldCls}
                value={values.preferredContactMethod ?? ""}
                onChange={(e) =>
                  update(
                    "preferredContactMethod",
                    e.target.value === ""
                      ? null
                      : (e.target.value as RegisterFormValues["preferredContactMethod"]),
                  )
                }
              >
                <option value="">— No preference —</option>
                <option value="phone">Phone / โทร</option>
                <option value="line">Line</option>
                <option value="email">Email</option>
              </select>
            </div>
          </fieldset>

          <fieldset className="grid gap-3 rounded-[var(--radius-md)] border border-line bg-soft p-4">
            <legend className="font-display text-base text-accent-strong">
              Your pet / สัตว์เลี้ยง <span className="text-xs text-muted">(optional)</span>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="petName">
                  Name / ชื่อ
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
                <label className={labelCls} htmlFor="petSpecies">
                  Species / ชนิด
                </label>
                <select
                  id="petSpecies"
                  className={fieldCls}
                  value={values.pet?.species ?? "cat"}
                  onChange={(e) =>
                    updatePet(
                      "species",
                      e.target.value as NonNullable<
                        RegisterFormValues["pet"]
                      >["species"],
                    )
                  }
                >
                  {SPECIES.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
                  className={fieldCls}
                  type="date"
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
                value={values.pet?.allergies ?? ""}
                onChange={(e) => updatePet("allergies", e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="petPreferences">
                Likes / ของโปรด
              </label>
              <input
                id="petPreferences"
                className={fieldCls}
                value={values.pet?.preferences ?? ""}
                onChange={(e) => updatePet("preferences", e.target.value)}
                maxLength={200}
              />
            </div>
          </fieldset>

          <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-line bg-panel p-3 text-sm text-text">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={Boolean(values.consentMarketing)}
              onChange={(e) => update("consentMarketing", e.target.checked)}
            />
            <span>
              <span className="font-bold">
                OK to message me about future products & promos.
              </span>{" "}
              <span className="text-muted">
                / ยินยอมให้ส่งข่าวสารโปรโมชั่นในอนาคต
              </span>
            </span>
          </label>

          {submitError && (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-bad-soft-bg)] bg-[var(--color-bad-soft-bg)] p-3 text-sm font-bold text-[var(--color-bad-soft-fg)]">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-accent rounded-[var(--radius-md)] px-5 py-3 text-base font-bold disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save / บันทึก"}
          </button>

          <p className="text-center text-[11px] text-muted">
            Token: <span className="num">{token}</span>
          </p>
        </form>
      </div>
    </main>
  );
}
