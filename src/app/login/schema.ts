import { z } from "zod";

// Sign-in is intentionally minimal: email + password. We validate the email
// shape client-side for a fast hint, but the password is only checked for
// presence — Supabase Auth is the real authority on whether it's correct.
export const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(1, "Enter your password").max(200),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

// DD-40 — request a password-reset email.
export const forgotFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
});
export type ForgotFormValues = z.infer<typeof forgotFormSchema>;

// DD-40 — set a new password (used inside a recovery session).
export const resetFormSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(200),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });
export type ResetFormValues = z.infer<typeof resetFormSchema>;
