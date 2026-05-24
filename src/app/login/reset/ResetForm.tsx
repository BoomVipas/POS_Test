"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Dict } from "@/lib/i18n/dictionaries";
import { resetFormSchema, type ResetFormValues } from "../schema";
import { updatePassword } from "../actions";

export function ResetForm({ t }: { t: Dict["passwordReset"] }) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: "", confirm: "" },
  });

  function onSubmit(values: ResetFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await updatePassword(values);
      // Success redirects server-side (NEXT_REDIRECT); only failures land here.
      if (res?.ok === false) {
        setServerError(res.message);
        if (res.fieldErrors) {
          for (const [path, msg] of Object.entries(res.fieldErrors)) {
            setError(path as keyof ResetFormValues, { message: msg });
          }
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <Field label={t.newPasswordLabel} error={errors.password?.message}>
        <input
          {...register("password")}
          type="password"
          className={inputCls}
          placeholder={t.newPasswordPlaceholder}
          autoComplete="new-password"
          autoFocus
        />
      </Field>
      <Field label={t.confirmLabel} error={errors.confirm?.message}>
        <input
          {...register("confirm")}
          type="password"
          className={inputCls}
          placeholder={t.confirmPlaceholder}
          autoComplete="new-password"
        />
      </Field>

      {serverError && <ErrorBanner>{serverError}</ErrorBanner>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-[14px] py-3.5 text-[15px] font-extrabold text-white shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 disabled:opacity-60"
        style={{ background: "var(--grad-primary)" }}
      >
        {pending ? t.updating : t.updateCta}
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-[var(--color-danger-soft-fg)]">
          {error}
        </span>
      )}
    </label>
  );
}
