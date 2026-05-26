import { describe, expect, it } from "vitest";
import { buildClaimRegistrationPayload } from "@/lib/customer-registration/payload";

describe("buildClaimRegistrationPayload", () => {
  it("builds the snake_case payload expected by claim_registration_token", () => {
    const payload = buildClaimRegistrationPayload({
      displayName: "Pim",
      preferredContactMethod: "phone",
      consentMarketing: true,
      phone: "0800000000",
      email: "pim@example.com",
      lineId: "pimline",
      pet: {
        name: "Milo",
        species: "cat",
        breed: "Bombay",
        birthday: "2022-03-04",
        allergies: "chicken",
        preferences: "catnip",
      },
    });

    expect(payload).toEqual({
      customer: {
        display_name: "Pim",
        preferred_contact_method: "phone",
        consent_marketing: true,
      },
      contacts: [
        { channel: "phone", value: "0800000000", is_primary: true },
        { channel: "email", value: "pim@example.com", is_primary: false },
        { channel: "line", value: "pimline", is_primary: false },
      ],
      pets: [
        {
          name: "Milo",
          species: "cat",
          breed: "Bombay",
          birthday: "2022-03-04",
          allergies: "chicken",
          preferences: "catnip",
        },
      ],
    });
  });

  it("omits blank optional contact and pet rows", () => {
    const payload = buildClaimRegistrationPayload({
      displayName: "",
      preferredContactMethod: null,
      consentMarketing: false,
      pet: {
        name: "",
        species: "dog",
      },
    });

    expect(payload).toEqual({
      customer: {
        display_name: null,
        preferred_contact_method: null,
        consent_marketing: false,
      },
      contacts: [],
      pets: [],
    });
  });
});
