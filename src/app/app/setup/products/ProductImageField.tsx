"use client";

import { useState } from "react";
import { productImageUrl, validateProductImage } from "@/lib/products/image";

// #45 / #1 — product photo picker inside the add/edit form. Validates + previews
// locally and hands the File up to the form; the form uploads it on submit (via
// setProductImage), so a new product + its photo are set up in ONE action (and
// an edit only persists a new photo when you Save).
export function ProductImageField({
  initialPath,
  onPick,
}: {
  initialPath: string | null;
  onPick: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    productImageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", initialPath),
  );
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0] ?? null;
    e.currentTarget.value = ""; // allow re-picking the same file
    if (!file) return;
    const check = validateProductImage({ type: file.type, size: file.size });
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(null);
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    onPick(file);
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-bold text-text">Product photo</span>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-panel-strong">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] text-muted">No photo</span>
          )}
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onChange}
          />
          <span className="inline-block rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-sm font-bold text-accent-strong transition-colors hover:bg-panel-strong">
            {previewUrl ? "Replace photo" : "Upload photo"}
          </span>
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger-soft-fg)]">
          {error}
        </p>
      )}
      <p className="text-[11px] text-muted">
        JPG/PNG/WebP, up to 5 MB. Saved with the product; shows on the POS card.
      </p>
    </div>
  );
}
