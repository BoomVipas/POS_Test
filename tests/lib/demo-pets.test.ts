import { describe, it, expect } from "vitest";
import {
  petSummary,
  petsForPhoneKey,
  speciesLabel,
  type DemoPet,
} from "@/lib/demo/pets";

function pet(o: Partial<DemoPet> = {}): DemoPet {
  return {
    id: "p1",
    customerPhoneKey: "812345678",
    name: "Mochi",
    species: "cat",
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...o,
  };
}

describe("petsForPhoneKey", () => {
  it("filters by canonical phone key", () => {
    const all = [
      pet({ id: "1", customerPhoneKey: "812345678" }),
      pet({ id: "2", customerPhoneKey: "987654321" }),
      pet({ id: "3", customerPhoneKey: "812345678" }),
    ];
    expect(petsForPhoneKey(all, "812345678")).toHaveLength(2);
    expect(petsForPhoneKey(all, "987654321")).toHaveLength(1);
    expect(petsForPhoneKey(all, "111111111")).toHaveLength(0);
  });
});

describe("petSummary", () => {
  it("returns just the name when no metadata", () => {
    expect(petSummary(pet())).toBe("Mochi");
  });

  it("appends breed and weight", () => {
    expect(
      petSummary(pet({ breed: "Persian", weightKg: 4 })),
    ).toBe("Mochi (Persian, 4kg)");
  });

  it("uses age when weight is missing", () => {
    expect(
      petSummary(pet({ breed: "Siamese", ageYears: 3 })),
    ).toBe("Mochi (Siamese, 3y)");
  });

  it("trims empty breed strings", () => {
    expect(petSummary(pet({ breed: "   " }))).toBe("Mochi");
  });

  it("ignores zero weight", () => {
    expect(petSummary(pet({ weightKg: 0, breed: "Bombay" }))).toBe(
      "Mochi (Bombay)",
    );
  });
});

describe("speciesLabel", () => {
  it("maps species to display string", () => {
    expect(speciesLabel("cat")).toBe("Cat");
    expect(speciesLabel("rabbit")).toBe("Rabbit");
  });
});
