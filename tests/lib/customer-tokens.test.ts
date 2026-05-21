import { describe, it, expect } from "vitest";
import {
  applyClaim,
  buildToken,
  generateTokenString,
  portalUrlFor,
  validateToken,
  type DemoCustomerToken,
} from "@/lib/demo/customer-tokens";

describe("Wave 40b — generateTokenString", () => {
  it("returns a 16-char ambiguity-safe alphanumeric token by default", () => {
    const token = generateTokenString();
    expect(token).toHaveLength(16);
    expect(token).toMatch(/^[A-HJ-NP-Za-hj-km-np-z2-9]{16}$/);
  });

  it("excludes I / O / 0 / 1 / i / l / o for OCR + voice clarity", () => {
    for (let i = 0; i < 100; i++) {
      const t = generateTokenString();
      expect(t).not.toMatch(/[IO0il1o]/);
    }
  });

  it("respects custom length", () => {
    expect(generateTokenString(8)).toHaveLength(8);
    expect(generateTokenString(24)).toHaveLength(24);
  });
});

describe("Wave 40b — buildToken", () => {
  it("creates a token with 90-day default expiry, unclaimed", () => {
    const now = new Date("2026-05-07T00:00:00Z");
    const row = buildToken("order-1", now);
    expect(row.orderId).toBe("order-1");
    expect(row.token).toHaveLength(16);
    expect(row.claimedAt).toBeNull();
    expect(row.claimedCustomerId).toBeNull();
    const expires = new Date(row.expiresAt);
    const days = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(days).toBeCloseTo(90, 0);
  });
});

describe("Wave 40b — validateToken", () => {
  const now = new Date("2026-05-07T00:00:00Z");
  const valid: DemoCustomerToken = {
    id: "tok_1",
    token: "ABCDEFGHJKMNPQ23",
    orderId: "order-1",
    expiresAt: new Date("2026-08-05T00:00:00Z").toISOString(),
    createdAt: now.toISOString(),
    claimedAt: null,
    claimedCustomerId: null,
  };

  it("ok = true for a fresh, unclaimed, unexpired token", () => {
    const result = validateToken([valid], "ABCDEFGHJKMNPQ23", now);
    expect(result.ok).toBe(true);
  });

  it("returns token-not-found when token string mismatches", () => {
    const result = validateToken([valid], "wrongtoken123456", now);
    expect(result).toEqual({ ok: false, reason: "token-not-found" });
  });

  it("returns token-already-claimed when claimedAt is set", () => {
    const claimed = { ...valid, claimedAt: now.toISOString() };
    const result = validateToken([claimed], valid.token, now);
    expect(result).toEqual({ ok: false, reason: "token-already-claimed" });
  });

  it("returns token-expired when expiresAt has passed", () => {
    const expired = {
      ...valid,
      expiresAt: new Date("2026-05-01T00:00:00Z").toISOString(),
    };
    const result = validateToken([expired], valid.token, now);
    expect(result).toEqual({ ok: false, reason: "token-expired" });
  });
});

describe("Wave 40b — applyClaim", () => {
  const now = new Date("2026-05-07T00:00:00Z");
  const tokenRow: DemoCustomerToken = {
    id: "tok_1",
    token: "TOKENXYZ12345678",
    orderId: "order-1",
    expiresAt: new Date("2026-08-05T00:00:00Z").toISOString(),
    createdAt: now.toISOString(),
    claimedAt: null,
    claimedCustomerId: null,
  };

  it("ok = true; new customer + token marked claimed; old customers preserved", () => {
    const result = applyClaim(
      [tokenRow],
      [],
      tokenRow.token,
      {
        displayName: "Pim",
        preferredContactMethod: "phone",
        consentMarketing: true,
        contacts: [
          { channel: "phone", value: "0800000000", isPrimary: true },
        ],
        pets: [{ name: "Milo", species: "cat", breed: "Bombay" }],
      },
      now,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.customer.displayName).toBe("Pim");
    expect(result.customer.contacts).toHaveLength(1);
    expect(result.customer.pets).toHaveLength(1);
    expect(result.customer.pets[0].name).toBe("Milo");
    expect(result.tokens).toBeDefined();
    expect(result.tokens![0].claimedAt).toBe(now.toISOString());
    expect(result.tokens![0].claimedCustomerId).toBe(result.customer.id);
    expect(result.customers).toHaveLength(1);
  });

  it("filters empty pets / blank contacts before saving", () => {
    const result = applyClaim(
      [tokenRow],
      [],
      tokenRow.token,
      {
        consentMarketing: false,
        contacts: [
          { channel: "phone", value: "0800000000", isPrimary: true },
          { channel: "email", value: "  ", isPrimary: false },
        ],
        pets: [
          { name: "Milo", species: "cat" },
          { name: "  ", species: "dog" },
        ],
      },
      now,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.customer.contacts).toHaveLength(1);
    expect(result.customer.pets).toHaveLength(1);
  });

  it("ok = false (token-already-claimed) on second claim of same token", () => {
    const first = applyClaim(
      [tokenRow],
      [],
      tokenRow.token,
      { consentMarketing: false, contacts: [], pets: [] },
      now,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = applyClaim(
      first.tokens!,
      first.customers!,
      tokenRow.token,
      { consentMarketing: false, contacts: [], pets: [] },
      now,
    );
    expect(second).toEqual({ ok: false, reason: "token-already-claimed" });
  });

  it("ok = false (token-expired) when token TTL has passed", () => {
    const expired = {
      ...tokenRow,
      expiresAt: new Date("2026-05-01T00:00:00Z").toISOString(),
    };
    const result = applyClaim(
      [expired],
      [],
      tokenRow.token,
      { consentMarketing: false, contacts: [], pets: [] },
      now,
    );
    expect(result).toEqual({ ok: false, reason: "token-expired" });
  });
});

describe("Wave 40b — portalUrlFor", () => {
  it("builds a URL-encoded portal URL", () => {
    expect(portalUrlFor("ABC123", "https://mochi.app")).toBe(
      "https://mochi.app/register/ABC123",
    );
  });

  it("strips trailing slash from origin", () => {
    expect(portalUrlFor("ABC123", "https://mochi.app/")).toBe(
      "https://mochi.app/register/ABC123",
    );
  });

  it("encodes URL-special characters in the token", () => {
    expect(portalUrlFor("a/b+c", "https://x.test")).toBe(
      "https://x.test/register/a%2Fb%2Bc",
    );
  });
});
