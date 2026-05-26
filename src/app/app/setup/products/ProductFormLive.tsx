"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { parseProductInput, type ProductInput } from "@/lib/products/parse";
import type { ProductActionResult } from "./actions";
import type { LiveProduct } from "./product-row";
import { ProductImageField } from "./ProductImageField";

const empty = (): ProductInput => ({
  sku: "",
  name: "",
  category: "uncategorized",
  priceBaht: "",
  shippingFeeBaht: "0",
  startingQty: "0",
  sendLaterEnabled: true,
  note: "",
});

function fromProduct(p: LiveProduct): ProductInput {
  return {
    sku: p.sku,
    name: p.name,
    category: p.category,
    priceBaht: (p.price_satang / 100).toString(),
    shippingFeeBaht: (p.shipping_fee_satang / 100).toString(),
    startingQty: String(p.default_starting_qty),
    sendLaterEnabled: p.send_later_enabled,
    note: p.note ?? "",
  };
}

export function ProductFormLive({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: LiveProduct | null;
  onSubmit: (input: ProductInput, id: string | null) => Promise<ProductActionResult>;
}) {
  // Lazily initialised from props; the parent remounts this component (via a
  // `key` that changes on open / edit-target) so the form resets without a
  // setState-in-effect.
  const [v, setV] = useState<ProductInput>(() =>
    initial ? fromProduct(initial) : empty(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function set<K extends keyof ProductInput>(key: K, val: ProductInput[K]) {
    setDirty(true);
    setV((s) => ({ ...s, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    // Instant client-side validation (same rules the action re-checks).
    const parsed = parseProductInput(v);
    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const res = await onSubmit(v, initial?.id ?? null);
      if (res.ok) {
        push({
          kind: "success",
          title: initial ? "Product updated" : "Product added",
          message: `${parsed.value.sku} — ${parsed.value.name}`,
        });
        onClose();
      } else {
        setServerError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit product" : "Add product"}
      size="md"
      confirmClose={() => dirty && !pending}
    >
      <form onSubmit={handleSubmit} className="grid gap-3">
        <TextInput
          label="SKU"
          value={v.sku}
          onChange={(e) => set("sku", e.currentTarget.value)}
          placeholder="HOODIE-001"
          autoComplete="off"
          autoCapitalize="characters"
          error={errors.sku}
          maxLength={32}
          disabled={!!initial}
          hint={initial ? "SKU can't be changed after creation" : undefined}
        />
        <TextInput
          label="Name"
          value={v.name}
          onChange={(e) => set("name", e.currentTarget.value)}
          placeholder="Cat Hoodie"
          error={errors.name}
          maxLength={160}
        />
        <TextInput
          label="Category"
          value={v.category}
          onChange={(e) => set("category", e.currentTarget.value)}
          placeholder="apparel"
          error={errors.category}
          maxLength={80}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberInput
            label="Price (THB)"
            value={v.priceBaht}
            onChange={(e) => set("priceBaht", e.currentTarget.value)}
            placeholder="890"
            min={0}
            step={1}
            error={errors.priceBaht}
          />
          <NumberInput
            label="Shipping fee (THB, send-later)"
            value={v.shippingFeeBaht}
            onChange={(e) => set("shippingFeeBaht", e.currentTarget.value)}
            placeholder="0"
            min={0}
            step={1}
            error={errors.shippingFeeBaht}
          />
        </div>
        <NumberInput
          label="Starting stock per event"
          value={v.startingQty}
          onChange={(e) => set("startingQty", e.currentTarget.value)}
          placeholder="30"
          min={0}
          step={1}
          error={errors.startingQty}
          hint="Default quantity allocated when this product joins an event."
        />
        <Textarea
          label="Note (optional)"
          value={v.note}
          onChange={(e) => set("note", e.currentTarget.value)}
          placeholder="Anything the cashier should know"
          rows={2}
          error={errors.note}
          maxLength={500}
        />
        <Checkbox
          checked={v.sendLaterEnabled}
          onChange={(e) => set("sendLaterEnabled", e.currentTarget.checked)}
          label="Send-later enabled"
          hint="Customer can buy this even when it's out of stock at the booth."
        />

        {initial ? (
          <ProductImageField productId={initial.id} initialPath={initial.image_path} />
        ) : (
          <p className="text-[11px] text-muted">
            Save the product, then re-open it to add a photo.
          </p>
        )}

        {serverError && (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-3 py-2 text-sm text-[var(--color-danger-soft-fg)]"
          >
            {serverError}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {initial ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
