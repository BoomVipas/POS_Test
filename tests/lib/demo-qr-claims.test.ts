import { describe, it, expect } from "vitest";
import {
  findRedeemableClaim,
  generateUniqueCode,
  type DemoClaim,
} from "@/lib/demo/qr-claims";

function claim(over: Partial<DemoClaim> = {}): DemoClaim {
  return {
    id: "id-1",
    code: "ABCD",
    lines: [],
    customerName: "Aim",
    status: "open",
    createdAt: "2026-05-04T08:00:00Z",
    redeemedAt: null,
    expiresAt: "2026-05-04T12:00:00Z",
    ...over,
  };
}

describe("qr-claims/generateUniqueCode", () => {
  it("returns a 4-char code from the ambiguity-safe alphabet by default", () => {
    const c = generateUniqueCode([]);
    expect(c).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("avoids duplicates from existing list", () => {
    let next = 0;
    const buf = [0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 0.5];
    const rng = () => buf[next++ % buf.length];
    // First call uses [0,0,0,0] → "AAAA". Second call uses [0.5,...] → different.
    const a = generateUniqueCode([], 4, rng);
    const b = generateUniqueCode([{ code: a }], 4, rng);
    expect(a).not.toBe(b);
  });
});

describe("qr-claims/findRedeemableClaim", () => {
  it("finds open, unexpired claim case-insensitively", () => {
    const c = claim({ code: "T7K9" });
    expect(findRedeemableClaim([c], "t7k9", new Date("2026-05-04T10:00:00Z"))?.id).toBe(
      "id-1",
    );
  });

  it("trims whitespace", () => {
    const c = claim({ code: "T7K9" });
    expect(findRedeemableClaim([c], "  T7K9 ", new Date("2026-05-04T10:00:00Z"))?.id).toBe(
      "id-1",
    );
  });

  it("returns null for unknown code", () => {
    expect(findRedeemableClaim([claim()], "ZZZZ")).toBeNull();
  });

  it("returns null for redeemed claim", () => {
    expect(
      findRedeemableClaim(
        [claim({ status: "redeemed", code: "ABCD" })],
        "ABCD",
        new Date("2026-05-04T10:00:00Z"),
      ),
    ).toBeNull();
  });

  it("returns null for cancelled claim", () => {
    expect(
      findRedeemableClaim(
        [claim({ status: "cancelled", code: "ABCD" })],
        "ABCD",
        new Date("2026-05-04T10:00:00Z"),
      ),
    ).toBeNull();
  });

  it("returns null for expired claim", () => {
    expect(
      findRedeemableClaim(
        [claim({ code: "ABCD", expiresAt: "2026-05-04T08:30:00Z" })],
        "ABCD",
        new Date("2026-05-04T10:00:00Z"),
      ),
    ).toBeNull();
  });
});
