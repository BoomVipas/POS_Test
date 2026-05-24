// DD-40 — password-reset form schemas.

import { describe, expect, it } from "vitest";
import { forgotFormSchema, resetFormSchema } from "@/app/login/schema";

describe("forgotFormSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotFormSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(forgotFormSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    const r = forgotFormSchema.safeParse({ email: "  a@b.com  " });
    expect(r.success && r.data.email).toBe("a@b.com");
  });
});

describe("resetFormSchema", () => {
  it("accepts matching passwords of at least 8 chars", () => {
    expect(
      resetFormSchema.safeParse({ password: "longenough1", confirm: "longenough1" })
        .success,
    ).toBe(true);
  });

  it("rejects a password shorter than 8 chars", () => {
    expect(
      resetFormSchema.safeParse({ password: "short", confirm: "short" }).success,
    ).toBe(false);
  });

  it("flags a mismatch on the confirm field", () => {
    const r = resetFormSchema.safeParse({
      password: "longenough1",
      confirm: "different1",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some((i) => i.path.join(".") === "confirm"),
      ).toBe(true);
    }
  });
});
