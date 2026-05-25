// Wave 43 — event-setup form parse/validate.

import { describe, expect, it } from "vitest";
import { parseEventInput, isEventStatus } from "@/lib/events/parse";

const base = {
  name: "  Pet Expo  ",
  venue: "  IMPACT  ",
  startDate: "2026-06-01",
  endDate: "2026-06-04",
};

describe("parseEventInput", () => {
  it("normalises a valid event", () => {
    const r = parseEventInput(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({
        name: "Pet Expo",
        venue: "IMPACT",
        start_date: "2026-06-01",
        end_date: "2026-06-04",
      });
    }
  });

  it("allows an empty venue (→ null)", () => {
    const r = parseEventInput({ ...base, venue: "  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.venue).toBeNull();
  });

  it("allows a single-day event (end == start)", () => {
    const r = parseEventInput({ ...base, endDate: base.startDate });
    expect(r.ok).toBe(true);
  });

  it("requires a name", () => {
    const r = parseEventInput({ ...base, name: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.name).toBeTruthy();
  });

  it("rejects an end date before the start date", () => {
    const r = parseEventInput({ ...base, endDate: "2026-05-31" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.endDate).toBeTruthy();
  });

  it("rejects malformed dates", () => {
    const r = parseEventInput({ ...base, startDate: "01/06/2026" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.startDate).toBeTruthy();
  });

  it("rejects an over-long venue", () => {
    const r = parseEventInput({ ...base, venue: "v".repeat(161) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.venue).toBeTruthy();
  });
});

describe("isEventStatus", () => {
  it("accepts the four schema statuses", () => {
    for (const s of ["planned", "running", "closed", "archived"]) {
      expect(isEventStatus(s)).toBe(true);
    }
  });
  it("rejects anything else", () => {
    expect(isEventStatus("open")).toBe(false);
    expect(isEventStatus("")).toBe(false);
  });
});
