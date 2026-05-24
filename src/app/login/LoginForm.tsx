"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Dict } from "@/lib/i18n/dictionaries";
import { loginFormSchema, type LoginFormValues } from "./schema";
import { signIn, type SignInResult } from "./actions";

export function LoginForm({
  t,
  next,
}: {
  t: Dict["login"];
  next: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  function localize(res: SignInResult): string {
    if (res.reason === "invalid") return t.errorInvalid;
    if (res.reason === "config") return t.errorConfig;
    return res.message;
  }

  function onSubmit(values: LoginFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await signIn(values, next);
      // A successful sign-in redirects server-side (redirect() throws
      // NEXT_REDIRECT and the router navigates), so the awaited value is only
      // present on failure.
      if (res?.ok === false) {
        setServerError(localize(res));
        if (res.fieldErrors) {
          for (const [path, msg] of Object.entries(res.fieldErrors)) {
            setError(path as keyof LoginFormValues, { message: msg });
          }
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <Field label={t.emailLabel} error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          className={inputCls}
          placeholder={t.emailPlaceholder}
          autoComplete="email"
          autoFocus
        />
      </Field>

      <Field label={t.passwordLabel} error={errors.password?.message}>
        <input
          {...register("password")}
          type="password"
          className={inputCls}
          placeholder={t.passwordPlaceholder}
          autoComplete="current-password"
        />
      </Field>

      <div className="-mt-2 text-right">
        <Link
          href="/login/forgot"
          className="text-xs font-bold text-accent hover:underline"
        >
          {t.forgotPassword}
        </Link>
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-[14px] py-3.5 text-[15px] font-extrabold text-white shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 disabled:opacity-60"
        style={{ background: "var(--grad-primary)" }}
      >
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-[12px] border border-line bg-panel px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-[var(--indigo-500)] focus:ring-4 focus:ring-[var(--lavender-200)]";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
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
