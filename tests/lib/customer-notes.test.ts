import { describe, it, expect } from "vitest";
import {
  getNoteByPhone,
  setNoteByPhone,
  toggleTag,
  type DemoCustomerNote,
} from "@/lib/demo/customer-notes";

const noteA: DemoCustomerNote = {
  note: "VIP, gives feedback",
  tags: ["vip", "frequent"],
  updatedAt: "2026-05-01T00:00:00Z",
};

describe("customer-notes/getNoteByPhone", () => {
  it("matches across phone formats (canonical key)", () => {
    const store = { "812345678": noteA };
    expect(getNoteByPhone(store, "0812345678")).toEqual(noteA);
    expect(getNoteByPhone(store, "+66812345678")).toEqual(noteA);
    expect(getNoteByPhone(store, "081-234-5678")).toEqual(noteA);
  });

  it("returns null for too-short phones", () => {
    expect(getNoteByPhone({}, "12")).toBeNull();
    expect(getNoteByPhone({}, "")).toBeNull();
  });

  it("returns null when no match", () => {
    expect(getNoteByPhone({ "812345678": noteA }, "0899999999")).toBeNull();
  });
});

describe("customer-notes/setNoteByPhone", () => {
  it("creates a new entry with the canonical key", () => {
    const next = setNoteByPhone({}, "0812345678", {
      note: "Hi",
      tags: ["vip"],
    });
    expect(Object.keys(next)).toEqual(["812345678"]);
    expect(next["812345678"].note).toBe("Hi");
    expect(next["812345678"].tags).toEqual(["vip"]);
    expect(typeof next["812345678"].updatedAt).toBe("string");
  });

  it("merges partial patches", () => {
    const start = setNoteByPhone({}, "0812345678", {
      note: "First",
      tags: ["vip"],
    });
    const next = setNoteByPhone(start, "+66812345678", {
      note: "Second",
    });
    expect(next["812345678"].note).toBe("Second");
    expect(next["812345678"].tags).toEqual(["vip"]); // unchanged
  });

  it("returns input unchanged for too-short phones", () => {
    const out = setNoteByPhone({}, "abc", { note: "x" });
    expect(out).toEqual({});
  });
});

describe("customer-notes/toggleTag", () => {
  it("adds an absent tag", () => {
    expect(toggleTag([], "vip")).toEqual(["vip"]);
    expect(toggleTag(["frequent"], "vip")).toEqual(["frequent", "vip"]);
  });

  it("removes a present tag", () => {
    expect(toggleTag(["vip"], "vip")).toEqual([]);
    expect(toggleTag(["vip", "frequent"], "vip")).toEqual(["frequent"]);
  });

  it("normalizes case + trim", () => {
    expect(toggleTag([], "  VIP  ")).toEqual(["vip"]);
    expect(toggleTag(["vip"], "VIP")).toEqual([]);
  });

  it("ignores empty tag", () => {
    expect(toggleTag(["vip"], "  ")).toEqual(["vip"]);
  });
});
