"use client";

import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  hint?: string;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, hint, id: providedId, className, ...rest },
  ref,
) {
  const autoId = useId();
  const id = providedId ?? autoId;
  return (
    <label htmlFor={id} className="flex items-start gap-3">
      <input
        ref={ref}
        type="radio"
        id={id}
        className={cn(
          "mt-0.5 h-5 w-5 cursor-pointer accent-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1",
          className,
        )}
        {...rest}
      />
      <span className="select-none">
        {label && (
          <span className="block text-sm font-bold text-text">{label}</span>
        )}
        {hint && (
          <span className="mt-0.5 block text-xs text-muted">{hint}</span>
        )}
      </span>
    </label>
  );
});
