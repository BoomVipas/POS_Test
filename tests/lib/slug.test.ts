import { describe, it, expect } from "vitest";
import { generateSlug, generateSlugCandidates, isValidSlug } from "@/lib/slug";

describe("slug/generateSlug", () => {
  it("lowercases and replaces spaces", () => {
    expect(generateSlug("Meow House")).toBe("meow-house");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(generateSlug("--Meow!! House  ")).toBe("meow-house");
  });

  it("strips diacritics", () => {
    expect(generateSlug("Café Niño")).toBe("cafe-nino");
  });

  it("clamps to maxLength", () => {
    expect(generateSlug("a".repeat(80), { maxLength: 10 })).toBe("a".repeat(10));
  });

  it("returns fallback when result would be empty", () => {
    expect(generateSlug("!!!", { fallback: "shop" })).toBe("shop");
  });
});

describe("slug/generateSlugCandidates", () => {
  it("returns base + numbered fallbacks", () => {
    expect(generateSlugCandidates("Meow House", 3)).toEqual([
      "meow-house",
      "meow-house-2",
      "meow-house-3",
    ]);
  });
});

describe("slug/isValidSlug (matches the redeem_invite_code RPC regex)", () => {
  it("accepts lowercase alphanumerics with internal hyphens", () => {
    expect(isValidSlug("meow-house")).toBe(true);
    expect(isValidSlug("brand2")).toBe(true);
    expect(isValidSlug("a")).toBe(true);
    expect(isValidSlug("cat-booth-2")).toBe(true);
  });

  it("rejects leading/trailing hyphens and empties", () => {
    expect(isValidSlug("-meow")).toBe(false);
    expect(isValidSlug("meow-")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });

  it("rejects uppercase, spaces, and other punctuation", () => {
    expect(isValidSlug("Meow")).toBe(false);
    expect(isValidSlug("meow house")).toBe(false);
    expect(isValidSlug("meow_house")).toBe(false);
    expect(isValidSlug("meow.house")).toBe(false);
  });

  it("agrees with generateSlug's output", () => {
    expect(isValidSlug(generateSlug("Meow House!! "))).toBe(true);
  });
});
