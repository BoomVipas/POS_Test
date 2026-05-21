import { describe, it, expect } from "vitest";
import {
  formatTHB,
  formatTHBWithUnit,
  bahtToSatang,
} from "@/lib/money/format";

describe("money/formatTHB", () => {
  it("renders whole baht with no decimals", () => {
    expect(formatTHB(0)).toBe("0");
    expect(formatTHB(100)).toBe("1");
    expect(formatTHB(2500)).toBe("25");
  });

  it("renders fractional baht with exactly two decimals", () => {
    expect(formatTHB(1)).toBe("0.01");
    expect(formatTHB(150)).toBe("1.50");
    expect(formatTHB(199)).toBe("1.99");
    expect(formatTHB(2550)).toBe("25.50");
  });

  it("groups thousands with commas (en-US)", () => {
    expect(formatTHB(100000)).toBe("1,000");
    expect(formatTHB(12345)).toBe("123.45");
    expect(formatTHB(123456789)).toBe("1,234,567.89");
  });

  it("handles negative amounts (e.g. refunds)", () => {
    expect(formatTHB(-150)).toBe("-1.50");
    expect(formatTHB(-100000)).toBe("-1,000");
  });
});

describe("money/formatTHBWithUnit", () => {
  it("appends the THB unit", () => {
    expect(formatTHBWithUnit(0)).toBe("0 THB");
    expect(formatTHBWithUnit(12345)).toBe("123.45 THB");
    expect(formatTHBWithUnit(100000)).toBe("1,000 THB");
  });
});

describe("money/bahtToSatang", () => {
  it("converts whole and fractional baht to integer satang", () => {
    expect(bahtToSatang(0)).toBe(0);
    expect(bahtToSatang(1)).toBe(100);
    expect(bahtToSatang(1.5)).toBe(150);
    expect(bahtToSatang(12.34)).toBe(1234);
    expect(bahtToSatang(99.99)).toBe(9999);
  });

  it("rounds to the nearest satang", () => {
    expect(bahtToSatang(1.999)).toBe(200);
    expect(bahtToSatang(0.016)).toBe(2);
    expect(bahtToSatang(0.014)).toBe(1);
  });

  it("always returns an integer (no float satang)", () => {
    for (const baht of [0.1, 0.2, 0.3, 1.1, 19.95, 250.05]) {
      expect(Number.isInteger(bahtToSatang(baht))).toBe(true);
    }
  });
});

describe("money round-trip (baht -> satang -> formatted)", () => {
  it("preserves the value", () => {
    expect(formatTHB(bahtToSatang(12.34))).toBe("12.34");
    expect(formatTHB(bahtToSatang(1000))).toBe("1,000");
    expect(formatTHBWithUnit(bahtToSatang(49.5))).toBe("49.50 THB");
  });
});
