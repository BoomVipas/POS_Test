import { describe, it, expect } from "vitest";
import { rangeToWindow } from "@/lib/dashboard/window";

describe("rangeToWindow", () => {
  it("bounds a single TH day with the +07:00 offset", () => {
    expect(rangeToWindow({ startDate: "2026-07-30", endDate: "2026-07-30" })).toEqual({
      startISO: "2026-07-30T00:00:00.000+07:00",
      endISO: "2026-07-30T23:59:59.999+07:00",
    });
  });

  it("spans a multi-day range (e.g. the Pet Expo window)", () => {
    const w = rangeToWindow({ startDate: "2026-07-30", endDate: "2026-08-02" });
    expect(w.startISO).toBe("2026-07-30T00:00:00.000+07:00");
    expect(w.endISO).toBe("2026-08-02T23:59:59.999+07:00");
  });

  it("produces parseable, correctly-ordered instants", () => {
    const w = rangeToWindow({ startDate: "2026-07-30", endDate: "2026-07-30" });
    expect(Date.parse(w.startISO)).toBeLessThan(Date.parse(w.endISO));
  });
});
