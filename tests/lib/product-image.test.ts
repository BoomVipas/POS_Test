import { describe, it, expect } from "vitest";
import {
  imageExtForType,
  validateProductImage,
  productImagePath,
  productImageUrl,
  MAX_IMAGE_BYTES,
} from "@/lib/products/image";

describe("imageExtForType", () => {
  it("maps the supported types", () => {
    expect(imageExtForType("image/jpeg")).toBe("jpg");
    expect(imageExtForType("image/png")).toBe("png");
    expect(imageExtForType("image/webp")).toBe("webp");
  });
  it("rejects unsupported types", () => {
    expect(imageExtForType("image/gif")).toBeNull();
    expect(imageExtForType("application/pdf")).toBeNull();
  });
});

describe("validateProductImage", () => {
  it("accepts a normal JPG", () => {
    expect(validateProductImage({ type: "image/jpeg", size: 250_000 })).toEqual({
      ok: true,
    });
  });
  it("rejects the wrong type", () => {
    const r = validateProductImage({ type: "image/gif", size: 1000 });
    expect(r.ok).toBe(false);
  });
  it("rejects an empty file", () => {
    expect(validateProductImage({ type: "image/png", size: 0 }).ok).toBe(false);
  });
  it("rejects an oversize file", () => {
    expect(
      validateProductImage({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }).ok,
    ).toBe(false);
  });
  it("accepts exactly the max size", () => {
    expect(
      validateProductImage({ type: "image/png", size: MAX_IMAGE_BYTES }).ok,
    ).toBe(true);
  });
});

describe("productImagePath", () => {
  it("is workspace-scoped and stable per product", () => {
    expect(productImagePath("ws1", "prod1", "jpg")).toBe("ws1/prod1.jpg");
  });
});

describe("productImageUrl", () => {
  it("returns null when there is no image", () => {
    expect(productImageUrl("https://x.supabase.co", null)).toBeNull();
  });
  it("builds a public-bucket URL", () => {
    expect(productImageUrl("https://x.supabase.co", "ws1/prod1.jpg")).toBe(
      "https://x.supabase.co/storage/v1/object/public/product-images/ws1/prod1.jpg",
    );
  });
  it("tolerates a trailing slash on the base URL", () => {
    expect(productImageUrl("https://x.supabase.co/", "a/b.png")).toBe(
      "https://x.supabase.co/storage/v1/object/public/product-images/a/b.png",
    );
  });
});
