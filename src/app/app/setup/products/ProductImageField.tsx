"use client";

import { useState, useTransition } from "react";
import { setProductImage } from "./image-actions";
import { productImageUrl } from "@/lib/products/image";

// #45 — product photo upload inside the edit form. Calls setProductImage (#16),
// previews the result, and cache-busts so a replaced photo (same path) refreshes.
// Only rendered for an existing product (needs its id); create-mode shows a hint.
export function ProductImageField({
  productId,
  initialPath,
}: {
  productId: string;
  initialPath: string | null;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [bust, setBust] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const baseUrl = productImageUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    path,
  );
  const src = baseUrl ? `${baseUrl}?v=${bust}` : null;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = ""; // allow re-picking the same file later
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await setProductImage(productId, fd);
      if (res.ok) {
        setPath(res.path);
        setBust((b) => b + 1);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-bold text-text">Product photo</span>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-panel-strong">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] text-muted">No photo</span>
          )}
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPick}
            disabled={pending}
          />
          <span className="inline-block rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-sm font-bold text-accent-strong transition-colors hover:bg-panel-strong">
            {pending ? "Uploading…" : path ? "Replace photo" : "Upload photo"}
          </span>
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger-soft-fg)]">
          {error}
        </p>
      )}
      <p className="text-[11px] text-muted">
        JPG/PNG/WebP, up to 5 MB. Shows on the POS product card.
      </p>
    </div>
  );
}
