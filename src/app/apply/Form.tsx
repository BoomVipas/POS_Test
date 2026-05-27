"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  applicationFormSchema,
  type ApplicationFormValues,
} from "./schema";
import { submitApplication } from "./actions";

type FormLabels = {
  fieldName: string;
  fieldPhone: string;
  fieldEmail: string;
  fieldBrand: string;
  fieldCategory: string;
  fieldSocial: string;
  fieldNumSkus: string;
  fieldEventsPerYear: string;
  fieldMessage: string;
  fieldMessagePlaceholder: string;
  submit: string;
  submitting: string;
  alreadyApproved: string;
  redeemInvite: string;
};

export function ApplyForm({ labels }: { labels: FormLabels }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      owner_name: "",
      phone: "",
      email: "",
      brand_name: "",
      product_category: "",
      social_link: "",
      num_skus: "",
      events_per_year: "",
      message: "",
      website: "",
    },
  });

  function onSubmit(values: ApplicationFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await submitApplication(values);
      if (res.ok) {
        router.push("/apply/success");
        return;
      }
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [path, msg] of Object.entries(res.fieldErrors)) {
          setError(path as keyof ApplicationFormValues, { message: msg });
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      {/* honeypot */}
      <input
        {...register("website")}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <Field label={labels.fieldName} error={errors.owner_name?.message}>
        <input
          {...register("owner_name")}
          className={inputCls}
          placeholder="e.g. Aim Visan"
          autoComplete="name"
        />
      </Field>

      <Field label={labels.fieldPhone} error={errors.phone?.message}>
        <input
          {...register("phone")}
          className={inputCls}
          placeholder="0xx-xxx-xxxx"
          autoComplete="tel"
          inputMode="tel"
        />
      </Field>

      <Field label={labels.fieldEmail} error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          className={inputCls}
          placeholder="you@brand.com"
          autoComplete="email"
        />
      </Field>

      <Field label={labels.fieldBrand} error={errors.brand_name?.message}>
        <input
          {...register("brand_name")}
          className={inputCls}
          placeholder="e.g. Meow House"
          autoComplete="organization"
        />
      </Field>

      <Field label={labels.fieldCategory} error={errors.product_category?.message}>
        <input
          {...register("product_category")}
          className={inputCls}
          placeholder="e.g. Home goods, snacks, apparel"
        />
      </Field>

      <Field
        label={labels.fieldSocial}
        error={errors.social_link?.message}
      >
        <input
          {...register("social_link")}
          type="url"
          className={inputCls}
          placeholder="https://..."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.fieldNumSkus} error={errors.num_skus?.message}>
          <input
            {...register("num_skus")}
            type="number"
            min={0}
            className={inputCls}
            placeholder="e.g. 25"
            inputMode="numeric"
          />
        </Field>
        <Field
          label={labels.fieldEventsPerYear}
          error={errors.events_per_year?.message}
        >
          <input
            {...register("events_per_year")}
            type="number"
            min={0}
            className={inputCls}
            placeholder="e.g. 6"
            inputMode="numeric"
          />
        </Field>
      </div>

      <Field
        label={labels.fieldMessage}
        error={errors.message?.message}
      >
        <textarea
          {...register("message")}
          className={`${inputCls} min-h-[110px]`}
          placeholder={labels.fieldMessagePlaceholder}
        />
      </Field>

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
        {pending ? labels.submitting : labels.submit}
      </button>

      <p className="text-center text-xs text-muted">
        {labels.alreadyApproved}{" "}
        <Link href="/register" className="font-bold text-accent hover:underline">
          {labels.redeemInvite} -&gt;
        </Link>
      </p>
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
