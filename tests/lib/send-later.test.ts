import { describe, it, expect } from "vitest";
import {
  SEND_LATER_STATUSES,
  isSendLaterStatus,
  isTerminal,
  nextStatus,
  canTransition,
  timestampColumnFor,
} from "@/lib/send-later/transitions";

describe("send-later isSendLaterStatus", () => {
  it("accepts every known status", () => {
    for (const s of SEND_LATER_STATUSES) {
      expect(isSendLaterStatus(s)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isSendLaterStatus("done")).toBe(false);
    expect(isSendLaterStatus("")).toBe(false);
    expect(isSendLaterStatus(null)).toBe(false);
    expect(isSendLaterStatus(3)).toBe(false);
  });
});

describe("send-later nextStatus / isTerminal", () => {
  it("walks the forward chain", () => {
    expect(nextStatus("pending")).toBe("packed");
    expect(nextStatus("packed")).toBe("shipped");
    expect(nextStatus("shipped")).toBe("completed");
  });

  it("has no forward step out of terminal states", () => {
    expect(nextStatus("completed")).toBeNull();
    expect(nextStatus("cancelled")).toBeNull();
  });

  it("flags terminal states", () => {
    expect(isTerminal("completed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("pending")).toBe(false);
    expect(isTerminal("packed")).toBe(false);
    expect(isTerminal("shipped")).toBe(false);
  });
});

describe("send-later canTransition", () => {
  it("allows each single forward step", () => {
    expect(canTransition("pending", "packed")).toEqual({ ok: true });
    expect(canTransition("packed", "shipped")).toEqual({ ok: true });
    expect(canTransition("shipped", "completed")).toEqual({ ok: true });
  });

  it("allows cancel from any non-terminal status", () => {
    expect(canTransition("pending", "cancelled")).toEqual({ ok: true });
    expect(canTransition("packed", "cancelled")).toEqual({ ok: true });
    expect(canTransition("shipped", "cancelled")).toEqual({ ok: true });
  });

  it("rejects skipping a step", () => {
    expect(canTransition("pending", "shipped")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(canTransition("pending", "completed")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects going backwards", () => {
    expect(canTransition("shipped", "packed")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(canTransition("packed", "pending")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects any move out of a terminal status", () => {
    expect(canTransition("completed", "cancelled")).toEqual({
      ok: false,
      reason: "terminal",
    });
    expect(canTransition("cancelled", "packed")).toEqual({
      ok: false,
      reason: "terminal",
    });
    expect(canTransition("completed", "completed")).toEqual({
      ok: false,
      reason: "terminal",
    });
  });

  it("rejects a no-op on a non-terminal status (not a forward step)", () => {
    expect(canTransition("pending", "pending")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("send-later timestampColumnFor", () => {
  it("maps each status to its stamp column", () => {
    expect(timestampColumnFor("packed")).toBe("packed_at");
    expect(timestampColumnFor("shipped")).toBe("shipped_at");
    expect(timestampColumnFor("completed")).toBe("completed_at");
    expect(timestampColumnFor("cancelled")).toBe("cancelled_at");
  });

  it("has no stamp column for pending", () => {
    expect(timestampColumnFor("pending")).toBeNull();
  });
});
