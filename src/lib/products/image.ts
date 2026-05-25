// Product image helpers — pure, so validation + path/URL logic is unit-tested
// without Supabase. The upload server action (image-actions.ts) uses these,
// then writes the stored path to products.image_path (column already exists).

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — booth photos are small

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function imageExtForType(mime: string): string | null {
  return EXT_BY_TYPE[mime] ?? null;
}

export type ImageValidation = { ok: true } | { ok: false; error: string };

export function validateProductImage(file: {
  type: string;
  size: number;
}): ImageValidation {
  if (!imageExtForType(file.type)) {
    return { ok: false, error: "Use a JPG, PNG, or WebP image." };
  }
  if (file.size <= 0) return { ok: false, error: "The image looks empty." };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }
  return { ok: true };
}

// Stable, workspace-scoped path — re-uploading a product's image overwrites
// (upsert) rather than piling up files. RLS doesn't cover Storage, so scoping
// the path by workspace_id keeps tenants' objects namespaced.
export function productImagePath(
  workspaceId: string,
  productId: string,
  ext: string,
): string {
  return `${workspaceId}/${productId}.${ext}`;
}

// Public URL for a stored image_path on the public product-images bucket.
// Returns null when the product has no image. Pure (no Supabase client) so the
// UI can build the URL from NEXT_PUBLIC_SUPABASE_URL + image_path.
export function productImageUrl(
  supabaseUrl: string,
  imagePath: string | null,
): string | null {
  if (!imagePath) return null;
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${imagePath}`;
}
