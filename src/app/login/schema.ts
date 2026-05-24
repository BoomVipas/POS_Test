import { z } from "zod";

// Sign-in is intentionally minimal: email + password. We validate the email
// shape client-side for a fast hint, but the password is only checked for
// presence — Supabase Auth is the real authority on whether it's correct.
export const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(1, "Enter your password").max(200),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
