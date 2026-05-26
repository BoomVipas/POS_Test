"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Dict } from "@/lib/i18n/dictionaries";
import {
  codeFormSchema,
  accountFormSchema,
  type CodeFormValues,
  type AccountFormValues,
} from "./schema";
import { validateInviteCode, completeRegistration } from "./actions";
import { GoogleButton } from "@/components/auth/GoogleButton";

type Invite = {
  code: string;
  brandName: string;
  email: string;
  suggestedSlug: string;
};

export function RegisterForm({ t }: { t: Dict["register"] }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  return invite ? (
    <AccountStep t={t} invite={invite} onBack={() => setInvite(null)} />
  ) : (
    <CodeStep t={t} onValidated={setInvite} />
  );
}

function CodeStep({
  t,
  onValidated,
}: {
  t: Dict["register"];
  onValidated: (invite: Invite) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CodeFormValues>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: "" },
  });

  function onSubmit(values: CodeFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await validateInviteCode(values.code);
      if (res.ok) {
        onValidated({
          code: values.code.trim().toUpperCase(),
          brandName: res.brandName,
          email: res.email,
          suggestedSlug: res.suggestedSlug,
        });
      } else {
        setServerError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <Field label={t.codeLabel} error={errors.code?.message}>
        <input
          {...register("code")}
          className={`${inputCls} font-mono uppercase tracking-wider`}
          placeholder={t.codePlaceholder}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
        />
      </Field>
      {serverError && <ErrorBanner>{serverError}</ErrorBanner>}
      <SubmitButton pending={pending} label={t.codeCta} pendingLabel="…" />
    </form>
  );
}

function AccountStep({
  t,
  invite,
  onBack,
}: {
  t: Dict["register"];
  invite: Invite;
  onBack: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { slug: invite.suggestedSlug, password: "", confirm: "" },
  });

  function onSubmit(values: AccountFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await completeRegistration(invite.code, values);
      // Success redirects server-side (NEXT_REDIRECT); we only land here on
      // failure.
      if (res?.ok === false) {
        setServerError(res.message);
        if (res.fieldErrors) {
          for (const [path, msg] of Object.entries(res.fieldErrors)) {
            setError(path as keyof AccountFormValues, { message: msg });
          }
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="rounded-[12px] border border-line bg-soft px-4 py-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
          {t.brandLabel}
        </p>
        <p className="text-sm font-bold text-accent-strong">{invite.brandName}</p>
        <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
          {t.emailLabel}
        </p>
        <p className="text-sm text-text">{invite.email}</p>
        <p className="mt-1 text-xs text-muted">{t.emailHint}</p>
      </div>

      <Field label={t.slugLabel} error={errors.slug?.message} hint={t.slugHint}>
        <input
          {...register("slug")}
          className={`${inputCls} font-mono`}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      <Field label={t.passwordLabel} error={errors.password?.message}>
        <input
          {...register("password")}
          type="password"
          className={inputCls}
          placeholder={t.passwordPlaceholder}
          autoComplete="new-password"
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
      <SubmitButton pending={pending} label={t.submit} pendingLabel={t.submitting} />

      <GoogleButton
        label={t.googleCta}
        genericError={t.errorGoogleGeneric}
        dividerLabel={t.orDivider}
        resolvePath={() => ({
          // Carry the invite + the *current* slug field through the OAuth
          // round-trip; /auth/callback re-validates the invite, matches the
          // Google email to it, and redeems with this slug.
          path: `/auth/callback?invite=${encodeURIComponent(
            invite.code,
          )}&slug=${encodeURIComponent(
            (getValues("slug") || "").trim().toLowerCase(),
          )}`,
        })}
      />
      <p className="-mt-1 text-center text-xs text-muted">{t.googleHint}</p>

      <button
        type="button"
        onClick={onBack}
        className="text-center text-xs font-bold text-muted transition-colors hover:text-text"
      >
        {t.useDifferentCode}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-[12px] border border-line bg-panel px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-[var(--indigo-500)] focus:ring-4 focus:ring-[var(--lavender-200)]";

function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-[14px] py-3.5 text-[15px] font-extrabold text-white shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 disabled:opacity-60"
      style={{ background: "var(--grad-primary)" }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

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
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-[var(--color-danger-soft-fg)]">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
