"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  applicationFormSchema,
  type ApplicationFormValues,
} from "./schema";
import { submitApplication } from "./actions";

export function ApplyForm() {
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

      <Field label="Your name" error={errors.owner_name?.message}>
        <input
          {...register("owner_name")}
          className={inputCls}
          placeholder="e.g. Aim Visan"
          autoComplete="name"
        />
      </Field>

      <Field label="Phone number" error={errors.phone?.message}>
        <input
          {...register("phone")}
          className={inputCls}
          placeholder="0xx-xxx-xxxx"
          autoComplete="tel"
          inputMode="tel"
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          className={inputCls}
          placeholder="you@brand.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Brand name" error={errors.brand_name?.message}>
        <input
          {...register("brand_name")}
          className={inputCls}
          placeholder="e.g. Meow House"
          autoComplete="organization"
        />
      </Field>

      <Field label="Product category" error={errors.product_category?.message}>
        <input
          {...register("product_category")}
          className={inputCls}
          placeholder="e.g. Cat apparel, treats, toys"
        />
      </Field>

      <Field
        label="Instagram / Facebook / website (optional)"
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
        <Field label="# of active SKUs" error={errors.num_skus?.message}>
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
          label="# of events per year"
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

      <Field label="Why us? (optional)" error={errors.message?.message}>
        <textarea
          {...register("message")}
          className={`${inputCls} min-h-[110px]`}
          placeholder="Anything you want us to know"
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
        className="btn-accent mt-2 rounded-[var(--radius-md)] px-6 py-3.5 text-base font-extrabold"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>

      <p className="text-xs text-muted">
        We review applications manually. Expect a reply within 3 working days.
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-line bg-panel px-3.5 py-3 text-[15px] text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-4 focus:ring-[color:var(--color-gold)]/30";

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
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.06em] text-muted">
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
