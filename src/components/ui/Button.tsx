"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-accent",
  secondary:
    "border border-line bg-panel text-accent-strong hover:bg-soft",
  ghost:
    "border border-transparent bg-transparent text-accent-strong hover:bg-soft",
  danger:
    "border border-[var(--color-danger-soft-fg)]/30 bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-soft-fg)] hover:brightness-95",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-extrabold",
  md: "rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold",
  lg: "rounded-2xl px-6 py-3 text-base font-extrabold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0",
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);
