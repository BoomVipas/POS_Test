import { z } from "zod";
import { isValidSlug } from "@/lib/slug";

// Step 1 — the invite code. Format is checked loosely here (server re-validates
// against the DB); we only guard against empty / absurd input.
export const codeFormSchema = z.object({
  code: z.string().trim().min(3, "Enter your invite code").max(80),
});
export type CodeFormValues = z.infer<typeof codeFormSchema>;

// Step 2 — account + workspace address. The slug rule mirrors the
// redeem_invite_code RPC regex (see lib/slug isValidSlug).
export const accountFormSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(60, "Keep it under 60 characters")
      .refine(isValidSlug, "Lowercase letters, numbers and hyphens only"),
    password: z.string().min(8, "Use at least 8 characters").max(200),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });
export type AccountFormValues = z.infer<typeof accountFormSchema>;
