// Customer registration tokens (Wave 40b — demo mode).
//
// Per VISION.md and PROJECT_VISION.md "checkout first, profile later":
// the cashier issues a one-shot 16-char token at sale completion. The
// customer redeems it via QR / share link to register their profile +
// optional pet info AFTER the sale, never blocking checkout.
//
// In demo mode the storage is localStorage. When Wave 40a (PR #5)
// merges + Supabase is provisioned, the API shape stays the same; the
// implementation swaps from this module to RPCs (`create_registration_token`
// + `claim_registration_token`).

export const DEMO_CUSTOMER_TOKENS_KEY = "pos-for-sell:demo-customer-tokens:v1";
export const DEMO_PORTAL_CUSTOMERS_KEY =
  "pos-for-sell:demo-portal-customers:v1";

export type ContactChannel = "phone" | "email" | "line" | "other";
export type PreferredContactMethod = "phone" | "email" | "line";
export type PetSpecies = "cat" | "dog" | "rabbit" | "bird" | "other";

export type DemoCustomerToken = {
  id: string;
  /** 16-char URL-safe alphanumeric. Generated server-side; treated as the credential. */
  token: string;
  orderId: string;
  /** ISO. Default 90-day expiry. */
  expiresAt: string;
  createdAt: string;
  claimedAt: string | null;
  claimedCustomerId: string | null;
};

export type DemoPortalContact = {
  channel: ContactChannel;
  value: string;
  isPrimary: boolean;
};

export type DemoPortalPet = {
  name: string;
  species: PetSpecies;
  breed?: string;
  weightKg?: number;
  birthday?: string;
  adoptionDay?: string;
  allergies?: string;
  preferences?: string;
  note?: string;
};

export type DemoPortalCustomer = {
  id: string;
  /** Set on claim. */
  registeredAt: string;
  /** Token id (not the token string itself) for traceability. */
  tokenId: string;
  /** Order linked at claim time. */
  orderId: string;
  displayName: string | null;
  preferredContactMethod: PreferredContactMethod | null;
  consentMarketing: boolean;
  contacts: DemoPortalContact[];
  pets: DemoPortalPet[];
};

export type ClaimPayload = {
  displayName?: string | null;
  preferredContactMethod?: PreferredContactMethod | null;
  consentMarketing: boolean;
  contacts: DemoPortalContact[];
  pets: DemoPortalPet[];
};

export type ClaimResult =
  | { ok: true; customer: DemoPortalCustomer }
  | {
      ok: false;
      reason:
        | "token-not-found"
        | "token-already-claimed"
        | "token-expired";
    };

const TOKEN_ALPHABET =
  "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
// Excludes I/O/0/1/i/l/o ambiguity. ~5.75 bits per char x 16 chars = ~92 bits.

export const DEFAULT_TTL_DAYS = 90;

export function newTokenId(): string {
  return `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newCustomerId(): string {
  return `cust_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 16-char ambiguity-safe alphanumeric token. The token IS the credential. */
export function generateTokenString(length = 16): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)];
  }
  return out;
}

export function readTokens(): DemoCustomerToken[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_CUSTOMER_TOKENS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoCustomerToken[]) : [];
  } catch {
    return [];
  }
}

export function writeTokens(tokens: DemoCustomerToken[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DEMO_CUSTOMER_TOKENS_KEY,
      JSON.stringify(tokens),
    );
  } catch {
    // quota — silent
  }
}

export function readPortalCustomers(): DemoPortalCustomer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_PORTAL_CUSTOMERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoPortalCustomer[]) : [];
  } catch {
    return [];
  }
}

export function writePortalCustomers(customers: DemoPortalCustomer[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DEMO_PORTAL_CUSTOMERS_KEY,
      JSON.stringify(customers),
    );
  } catch {
    // quota — silent
  }
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_CUSTOMER_TOKENS_KEY);
  window.localStorage.removeItem(DEMO_PORTAL_CUSTOMERS_KEY);
}

/** Pure: build a new token row, no I/O. */
export function buildToken(orderId: string, now = new Date()): DemoCustomerToken {
  const expires = new Date(now);
  expires.setDate(expires.getDate() + DEFAULT_TTL_DAYS);
  return {
    id: newTokenId(),
    token: generateTokenString(),
    orderId,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
    claimedAt: null,
    claimedCustomerId: null,
  };
}

/** Pure: validate a token against a snapshot. Returns the row or a reason. */
export function validateToken(
  tokens: DemoCustomerToken[],
  tokenString: string,
  now = new Date(),
):
  | { ok: true; row: DemoCustomerToken }
  | { ok: false; reason: "token-not-found" | "token-already-claimed" | "token-expired" } {
  const row = tokens.find((t) => t.token === tokenString);
  if (!row) return { ok: false, reason: "token-not-found" };
  if (row.claimedAt) return { ok: false, reason: "token-already-claimed" };
  if (new Date(row.expiresAt).getTime() < now.getTime()) {
    return { ok: false, reason: "token-expired" };
  }
  return { ok: true, row };
}

/** Pure: produce the new (tokens, customers) state after a claim, or a reason. */
export function applyClaim(
  tokens: DemoCustomerToken[],
  customers: DemoPortalCustomer[],
  tokenString: string,
  payload: ClaimPayload,
  now = new Date(),
): ClaimResult & { tokens?: DemoCustomerToken[]; customers?: DemoPortalCustomer[] } {
  const v = validateToken(tokens, tokenString, now);
  if (!v.ok) return { ok: false, reason: v.reason };
  const newCustomer: DemoPortalCustomer = {
    id: newCustomerId(),
    registeredAt: now.toISOString(),
    tokenId: v.row.id,
    orderId: v.row.orderId,
    displayName: payload.displayName?.trim() || null,
    preferredContactMethod: payload.preferredContactMethod ?? null,
    consentMarketing: Boolean(payload.consentMarketing),
    contacts: payload.contacts
      .filter((c) => c.value && c.value.trim().length > 0)
      .map((c) => ({ ...c, value: c.value.trim() })),
    pets: payload.pets
      .filter((p) => p.name && p.name.trim().length > 0)
      .map((p) => ({ ...p, name: p.name.trim() })),
  };
  const nextTokens = tokens.map((t) =>
    t.id === v.row.id
      ? { ...t, claimedAt: now.toISOString(), claimedCustomerId: newCustomer.id }
      : t,
  );
  const nextCustomers = [newCustomer, ...customers];
  return { ok: true, customer: newCustomer, tokens: nextTokens, customers: nextCustomers };
}

/** Public URL for a token. Caller passes `origin` so this works in SSR + tests. */
export function portalUrlFor(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/register/${encodeURIComponent(token)}`;
}
