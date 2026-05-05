// Per-customer notes & tags, keyed by normalized phone (phoneKey).
// Stored in a dedicated localStorage entry so customer aggregation logic
// (customers.ts) stays pure / derived-from-orders.

import { phoneKey } from "./customers";

export const DEMO_CUSTOMER_NOTES_KEY = "pos-for-sell:demo-customer-notes:v1";

export type DemoCustomerNote = {
  /** Free-form note from staff. */
  note: string;
  /** Lowercase tag strings (e.g. "vip", "allergic", "frequent"). */
  tags: string[];
  /** ISO timestamp of last update. */
  updatedAt: string;
};

/** Suggested common tags. Booth staff can still add freeform tags. */
export const SUGGESTED_TAGS = ["vip", "frequent", "allergic", "wholesale"];

type Store = Record<string, DemoCustomerNote>;

export function readCustomerNotes(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DEMO_CUSTOMER_NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Store;
    }
    return {};
  } catch {
    return {};
  }
}

export function writeCustomerNotes(s: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_CUSTOMER_NOTES_KEY, JSON.stringify(s));
  } catch {
    // quota — silently drop
  }
}

export function clearCustomerNotes(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_CUSTOMER_NOTES_KEY);
}

export function getNoteByPhone(
  store: Store,
  phone: string,
): DemoCustomerNote | null {
  const k = phoneKey(phone);
  if (!k) return null;
  return store[k] ?? null;
}

export function setNoteByPhone(
  store: Store,
  phone: string,
  patch: Partial<DemoCustomerNote>,
): Store {
  const k = phoneKey(phone);
  if (!k) return store;
  const prev = store[k] ?? { note: "", tags: [], updatedAt: "" };
  const next: DemoCustomerNote = {
    note: patch.note ?? prev.note,
    tags: patch.tags ?? prev.tags,
    updatedAt: new Date().toISOString(),
  };
  return { ...store, [k]: next };
}

/** Pure: toggle a tag on a customer's tag list (lowercased). */
export function toggleTag(tags: string[], tag: string): string[] {
  const t = tag.trim().toLowerCase();
  if (!t) return tags;
  return tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t];
}
