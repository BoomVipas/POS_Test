"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { validateSku } from "@/lib/sku";
import { bahtToSatang } from "@/lib/money/format";
import { compressImage } from "@/lib/image/compress";
import type { Product } from "@/lib/pos/types";

type FormValues = {
  sku: string;
  name: string;
  category: string;
  priceBaht: string;
  costBaht: string;
  shippingFeeBaht: string;
  startingQty: string;
  reorderPoint: string;
  sendLaterEnabled: boolean;
  imagePath: string | null; // data URL for the demo
};

const empty = (): FormValues => ({
  sku: "",
  name: "",
  category: "uncategorized",
  priceBaht: "",
  costBaht: "",
  shippingFeeBaht: "0",
  startingQty: "0",
  reorderPoint: "",
  sendLaterEnabled: true,
  imagePath: null,
});

function fromProduct(p: Product): FormValues {
  return {
    sku: p.sku,
    name: p.name,
    category: p.category,
    priceBaht: (p.price_satang / 100).toString(),
    costBaht:
      p.cost_satang && p.cost_satang > 0
        ? (p.cost_satang / 100).toString()
        : "",
    shippingFeeBaht: (p.shipping_fee_satang / 100).toString(),
    startingQty: String(p.current_qty),
    reorderPoint:
      typeof p.reorder_point === "number" && p.reorder_point > 0
        ? String(p.reorder_point)
        : "",
    sendLaterEnabled: p.send_later_enabled,
    imagePath: p.image_path,
  };
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function ProductFormModal({
  open,
  onClose,
  initial,
  workspaceId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: Product | null;
  workspaceId: string;
  onSubmit: (values: Omit<Product, "id">, originalId: string | null) => void;
}) {
  const [v, setV] = useState<FormValues>(empty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [uploading, setUploading] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    if (open) {
      setV(initial ? fromProduct(initial) : empty());
      setErrors({});
    }
  }, [open, initial]);

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setV((s) => ({ ...s, [key]: val }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        mimeType: "image/webp",
      });
      const dataUrl = await blobToDataUrl(result.blob);
      set("imagePath", dataUrl);
      push({
        kind: "success",
        title: "Image ready",
        message: `${Math.round(result.bytes / 1024)} KB · ${result.width}×${result.height}`,
      });
    } catch (err) {
      push({
        kind: "error",
        title: "Image failed",
        message: err instanceof Error ? err.message : "Could not compress",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};

    const sku = validateSku(v.sku);
    if (!sku.ok) next.sku = sku.reason;

    if (!v.name.trim()) next.name = "Name is required";
    if (v.name.length > 160) next.name = "Name is too long";

    const price = Number(v.priceBaht);
    if (!Number.isFinite(price) || price < 0) {
      next.priceBaht = "Price must be ≥ 0";
    }

    const costRaw = v.costBaht.trim();
    const cost = costRaw === "" ? null : Number(costRaw);
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      next.costBaht = "Cost must be ≥ 0";
    }

    const shipping = v.shippingFeeBaht.trim() === "" ? 0 : Number(v.shippingFeeBaht);
    if (!Number.isFinite(shipping) || shipping < 0) {
      next.shippingFeeBaht = "Shipping fee must be ≥ 0";
    }

    const qty = v.startingQty.trim() === "" ? 0 : Number(v.startingQty);
    if (!Number.isInteger(qty) || qty < 0) {
      next.startingQty = "Starting qty must be a non-negative integer";
    }

    const reorderRaw = v.reorderPoint.trim();
    const reorder = reorderRaw === "" ? null : Number(reorderRaw);
    if (reorder !== null && (!Number.isInteger(reorder) || reorder < 0)) {
      next.reorderPoint = "Reorder point must be a non-negative integer";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const product: Omit<Product, "id"> = {
      workspace_id: workspaceId,
      sku: sku.ok ? sku.normalized : v.sku,
      name: v.name.trim(),
      category: v.category.trim() || "uncategorized",
      price_satang: bahtToSatang(price),
      shipping_fee_satang: bahtToSatang(shipping),
      send_later_enabled: v.sendLaterEnabled,
      is_active: initial?.is_active ?? true,
      image_path: v.imagePath,
      current_qty: qty,
      ...(initial?.pinned ? { pinned: initial.pinned } : {}),
      ...(initial?.upsellSkus ? { upsellSkus: initial.upsellSkus } : {}),
      ...(cost !== null && cost > 0 ? { cost_satang: bahtToSatang(cost) } : {}),
      ...(reorder !== null && reorder > 0 ? { reorder_point: reorder } : {}),
    };

    onSubmit(product, initial?.id ?? null);
    push({
      kind: "success",
      title: initial ? "Product updated" : "Product added",
      message: `${product.sku} — ${product.name}`,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit product" : "Add product"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="grid gap-3">
        <TextInput
          label="SKU"
          value={v.sku}
          onChange={(e) => set("sku", e.currentTarget.value)}
          placeholder="DEMO-001"
          autoComplete="off"
          autoCapitalize="characters"
          error={errors.sku}
          maxLength={32}
          disabled={!!initial}
          hint={initial ? "SKU cannot be changed after creation" : undefined}
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
            label="Unit cost (THB, optional)"
            value={v.costBaht}
            onChange={(e) => set("costBaht", e.currentTarget.value)}
            placeholder="420"
            min={0}
            step={1}
            error={errors.costBaht}
            hint="Wholesale / landed cost. Powers margin reports."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberInput
            label="Shipping fee (THB, send-later)"
            value={v.shippingFeeBaht}
            onChange={(e) => set("shippingFeeBaht", e.currentTarget.value)}
            placeholder="0"
            min={0}
            step={1}
            error={errors.shippingFeeBaht}
          />
          <NumberInput
            label="Reorder at qty (optional)"
            value={v.reorderPoint}
            onChange={(e) => set("reorderPoint", e.currentTarget.value)}
            placeholder="10"
            min={0}
            step={1}
            error={errors.reorderPoint}
            hint="Dashboard flags when current stock ≤ this number."
          />
        </div>
        <NumberInput
          label="Starting qty"
          value={v.startingQty}
          onChange={(e) => set("startingQty", e.currentTarget.value)}
          placeholder="30"
          min={0}
          step={1}
          error={errors.startingQty}
        />
        <Checkbox
          checked={v.sendLaterEnabled}
          onChange={(e) => set("sendLaterEnabled", e.currentTarget.checked)}
          label="Send-later enabled"
          hint="Customer can buy this even when out of stock at the booth."
        />

        <div>
          <span className="mb-1.5 block text-sm font-bold text-accent-strong">
            Product image
          </span>
          <div className="flex items-start gap-3">
            <div className="h-24 w-24 flex-none overflow-hidden rounded-xl border border-line bg-soft">
              {v.imagePath ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={v.imagePath}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-[10px] font-bold uppercase tracking-wider text-muted">
                  no image
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="block text-sm text-muted file:mr-3 file:rounded-[var(--radius-md)] file:border-0 file:bg-soft file:px-4 file:py-2 file:text-sm file:font-bold file:text-accent-strong"
              />
              {v.imagePath && (
                <button
                  type="button"
                  onClick={() => set("imagePath", null)}
                  className="self-start text-xs font-bold text-[var(--color-danger-soft-fg)]"
                >
                  Remove image
                </button>
              )}
              <p className="text-xs text-muted">
                Auto-resized to ≤1024px and converted to WebP. Saved as a data
                URL in this browser only — replaced by Supabase Storage at DD-45.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initial ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
