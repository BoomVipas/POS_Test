"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, canWriteCatalog } from "@/lib/auth/workspace";
import {
  PRODUCT_IMAGE_BUCKET,
  validateProductImage,
  imageExtForType,
  productImagePath,
} from "@/lib/products/image";

export type ImageActionResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

// #16 — upload a product image to the public product-images bucket and store
// its path on products.image_path (column already exists; no migration). The
// UI half (#45) consumes this + productImageUrl() to render. Workspace + role
// gated (same as the other catalog writes); RLS independently enforces.
//
// Degrades gracefully: if the product-images bucket hasn't been created yet
// (a one-time Supabase dashboard step — see the PR/handoff), this returns a
// clear, non-fatal error rather than crashing, so the rest of the catalog flow
// keeps working.
export async function setProductImage(
  productId: string,
  formData: FormData,
): Promise<ImageActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };
  if (!canWriteCatalog(ws.role)) {
    return { ok: false, error: "You don't have permission to change the catalog." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No image selected." };

  const check = validateProductImage({ type: file.type, size: file.size });
  if (!check.ok) return check;

  const ext = imageExtForType(file.type);
  if (!ext) return { ok: false, error: "Use a JPG, PNG, or WebP image." };
  const path = productImagePath(ws.workspaceId, productId, ext);

  const supabase = await createClient();
  const { error: upErr } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) {
    const notSetUp = /bucket.*not.*found|not.*found/i.test(upErr.message);
    console.error("[products] image upload failed:", upErr.message);
    return {
      ok: false,
      error: notSetUp
        ? "Image storage isn't set up yet — an admin needs to create the public 'product-images' bucket in Supabase."
        : "Couldn't upload the image. Please try again.",
    };
  }

  const { error: dbErr } = await supabase
    .from("products")
    .update({ image_path: path, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("workspace_id", ws.workspaceId);
  if (dbErr) {
    console.error("[products] image_path save failed:", dbErr.message);
    return { ok: false, error: "Image uploaded but couldn't be linked. Please try again." };
  }

  revalidatePath("/app/setup/products");
  revalidatePath("/app/pos");
  return { ok: true, path };
}
