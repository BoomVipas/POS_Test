"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Dict } from "@/lib/i18n/dictionaries";
import { forgotFormSchema, type ForgotFormValues } from "../schema";
import { requestPasswordReset } from "../actions";

export function ForgotForm({ t }: { t: Dict["passwordReset"] }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotFormSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await requestPasswordReset(values.email);
      if (res.ok) setSent(true);
      else setServerError(res.error ?? "Something went wrong. Please try again.");
    });
  }

  // De-oracled confirmation: identical whether or not the email has an account.
  if (sent) {
    return (
      <div className="rounded-[12px] border border-[var(--color-ok-soft-fg)]/30 bg-[var(--color-ok-soft-bg)] px-4 py-4">
        <p className="text-sm font-extrabold text-[var(--color-ok-soft-fg)]">
          {t.sentTitle}
        </p>
        <p className="mt-1 text-sm text-text">{t.sentBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
          {t.emailLabel}
        </span>
        <input
          {...register("email")}
          type="email"
          className={inputCls}
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          autoFocus
        />
        {errors.email?.message && (
          <span className="mt-1 block text-xs text-[var(--color-danger-soft-fg)]">
            {errors.email.message}
          </span>
        )}
      </label>

      {serverError && <ErrorBanner>{serverError}</ErrorBanner>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-[14px] py-3.5 text-[15px] font-extrabold text-white shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 disabled:opacity-60"
        style={{ background: "var(--grad-primary)" }}
      >
        {pending ? t.sending : t.sendCta}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-[12px] border border-line bg-panel px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-[var(--indigo-500)] focus:ring-4 focus:ring-[var(--lavender-200)]";

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]"
    >
      {children}
    </p>
  );
}
