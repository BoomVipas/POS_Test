import type { Json } from "@/lib/database.types";

export type RegistrationFormPayload = {
  displayName?: string | null;
  preferredContactMethod?: "phone" | "email" | "line" | null;
  consentMarketing: boolean;
  phone?: string;
  email?: string;
  lineId?: string;
  pet?: {
    name?: string;
    species: "cat" | "dog" | "rabbit" | "bird" | "other";
    breed?: string;
    birthday?: string;
    allergies?: string;
    preferences?: string;
  };
};

export function buildClaimRegistrationPayload(
  values: RegistrationFormPayload,
): Json {
  const contacts = [
    values.phone
      ? { channel: "phone", value: values.phone, is_primary: true }
      : null,
    values.email
      ? {
          channel: "email",
          value: values.email,
          is_primary: !values.phone,
        }
      : null,
    values.lineId
      ? {
          channel: "line",
          value: values.lineId,
          is_primary: !values.phone && !values.email,
        }
      : null,
  ].filter(Boolean);

  const pets =
    values.pet?.name && values.pet.name.trim()
      ? [
          {
            name: values.pet.name,
            species: values.pet.species,
            breed: values.pet.breed || null,
            birthday: values.pet.birthday || null,
            allergies: values.pet.allergies || null,
            preferences: values.pet.preferences || null,
          },
        ]
      : [];

  return {
    customer: {
      display_name: values.displayName || null,
      preferred_contact_method: values.preferredContactMethod || null,
      consent_marketing: values.consentMarketing,
    },
    contacts,
    pets,
  } as Json;
}
