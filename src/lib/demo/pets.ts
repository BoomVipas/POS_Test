// Pet profiles attached to a phone-keyed customer.
//
// Pattern source: Pet Lovers Centre (regional pet retail) member-pet
// records, Thai cat-cafe/grooming POS conventions. Genuinely flavored
// for the booth-seller relationship — most international POS apps
// don't carry pet identity. Booth conversation IS about the cat:
// remembering "How is Mochi?" is the booth's competitive moat vs.
// Shopee/Lazada.

export const DEMO_PETS_KEY = "pos-for-sell:demo-pets:v1";

export type PetSpecies = "cat" | "dog" | "rabbit" | "bird" | "other";

export type DemoPet = {
  id: string;
  /** Canonicalized phone key (matches phoneKey() output, NOT raw input). */
  customerPhoneKey: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  weightKg?: number;
  ageYears?: number;
  allergies?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function readDemoPets(): DemoPet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_PETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoPet[]) : [];
  } catch {
    return [];
  }
}

export function writeDemoPets(pets: DemoPet[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_PETS_KEY, JSON.stringify(pets));
  } catch {
    // quota — silent
  }
}

export function clearDemoPets(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_PETS_KEY);
}

export function newPetId(): string {
  return `pet-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Pure: filter pets to those owned by a phoneKey. */
export function petsForPhoneKey(
  pets: DemoPet[],
  phoneKey: string,
): DemoPet[] {
  return pets.filter((p) => p.customerPhoneKey === phoneKey);
}

/** Pure: short summary like "Mochi (Persian, 4kg)" for the POS card. */
export function petSummary(p: DemoPet): string {
  const parts: string[] = [p.name];
  const meta: string[] = [];
  if (p.breed && p.breed.trim()) meta.push(p.breed);
  if (typeof p.weightKg === "number" && p.weightKg > 0) {
    meta.push(`${p.weightKg}kg`);
  } else if (typeof p.ageYears === "number" && p.ageYears > 0) {
    meta.push(`${p.ageYears}y`);
  }
  if (meta.length > 0) {
    return `${parts[0]} (${meta.join(", ")})`;
  }
  return parts[0];
}

export function speciesEmoji(s: PetSpecies): string {
  switch (s) {
    case "cat":
      return "🐱";
    case "dog":
      return "🐶";
    case "rabbit":
      return "🐰";
    case "bird":
      return "🐦";
    case "other":
      return "🐾";
  }
}

export function speciesLabel(s: PetSpecies): string {
  switch (s) {
    case "cat":
      return "Cat";
    case "dog":
      return "Dog";
    case "rabbit":
      return "Rabbit";
    case "bird":
      return "Bird";
    case "other":
      return "Other";
  }
}
