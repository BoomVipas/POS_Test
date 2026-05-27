import { describe, expect, it } from "vitest";
import type { ApplicationRow } from "@/lib/admin/application-search";
import {
  adminApplicationsHref,
  applicationMatchesSearch,
  normalizeApplicationSearch,
  parseApplicationStatus,
} from "@/lib/admin/application-search";

const application: ApplicationRow = {
  id: "app_1",
  owner_name: "Nicha Wong",
  phone: "081-222-3333",
  email: "nicha@example.com",
  brand_name: "Mochi Treats",
  product_category: "Pet snacks",
  social_link: null,
  num_skus: 12,
  events_per_year: 6,
  message: null,
  status: "approved",
  created_at: "2026-05-26T10:00:00.000Z",
  reviewed_at: null,
  reviewed_by: null,
};

describe("admin application search", () => {
  it("defaults unknown statuses to pending", () => {
    expect(parseApplicationStatus("registered")).toBe("registered");
    expect(parseApplicationStatus("not-real")).toBe("pending");
    expect(parseApplicationStatus(undefined)).toBe("pending");
  });

  it("normalizes whitespace and caps search length", () => {
    expect(normalizeApplicationSearch("  mochi   treats  ")).toBe("mochi treats");
    expect(normalizeApplicationSearch("x".repeat(120))).toHaveLength(80);
  });

  it("matches brand, owner, email, phone, category, and status", () => {
    expect(applicationMatchesSearch(application, "mochi")).toBe(true);
    expect(applicationMatchesSearch(application, "nicha")).toBe(true);
    expect(applicationMatchesSearch(application, "example.com")).toBe(true);
    expect(applicationMatchesSearch(application, "081-222")).toBe(true);
    expect(applicationMatchesSearch(application, "snacks")).toBe(true);
    expect(applicationMatchesSearch(application, "approved")).toBe(true);
    expect(applicationMatchesSearch(application, "coffee")).toBe(false);
  });

  it("keeps search terms when building status links", () => {
    expect(adminApplicationsHref({ status: "invited", search: " mochi treats " })).toBe(
      "/admin/applications?status=invited&q=mochi+treats",
    );
    expect(adminApplicationsHref({ status: "pending", search: "" })).toBe(
      "/admin/applications?status=pending",
    );
  });
});
