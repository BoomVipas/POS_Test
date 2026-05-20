import { z } from "zod";

// Form-level schema: every field is a string (or undefined) coming from inputs.
// The action transforms these into the DB row shape.
export const applicationFormSchema = z.object({
  owner_name: z.string().trim().min(2, "Name is too short").max(120),
  phone: z.string().trim().min(6, "Phone looks too short").max(40),
  email: z.string().trim().email("Invalid email").max(160),
  brand_name: z.string().trim().min(2, "Brand name is too short").max(160),
  product_category: z.string().trim().min(2, "Tell us your category").max(80),
  social_link: z
    .string()
    .trim()
    .max(240, "Link is too long")
    .optional()
    .or(z.literal("")),
  num_skus: z
    .string()
    .trim()
    .regex(/^\d*$/, "Whole number only")
    .max(6, "Too many digits")
    .optional()
    .or(z.literal("")),
  events_per_year: z
    .string()
    .trim()
    .regex(/^\d*$/, "Whole number only")
    .max(4, "Too many digits")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters")
    .optional()
    .or(z.literal("")),
  // honeypot — must be empty
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;
