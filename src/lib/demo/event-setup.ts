// Demo event-setup store, persisted to localStorage.
// Replaced by Supabase `events` + `event_inventory` at DD-43+. Marked clearly so
// the future swap is a focused refactor. This is the "stock allocation"
// centerpiece of the event-setup mockup (screens/event-setup.html): allocate
// catalog SKUs across event days, with a separate sample column pulled from
// warehouse. MVP scope — wizard chrome, booth-rule toggles, and gift-rule
// editor from the mockup are intentionally deferred.

import type { Product } from "@/lib/pos/types";

export const DEMO_EVENT_SETUP_KEY = "pos-for-sell:demo-event-setup:v1";

export const MIN_DAYS = 1;
export const MAX_DAYS = 8;
export const DEFAULT_DAYS = 4;

export type EventAllocation = {
  productId: string;
  /** Units sent to the booth per event day. Length always equals `dayCount`. */
  days: number[];
  /** Sample units pulled from warehouse; shown separately, never sold. */
  sample: number;
};

export type EventSetup = {
  id: string;
  name: string;
  /** ISO yyyy-mm-dd, or "" when unset. */
  startDate: string;
  location: string;
  dayCount: number;
  allocations: EventAllocation[];
  status: "draft" | "open";
  createdAt: string;
  updatedAt: string;
};

export type EventSummary = {
  skusAllocated: number;
  totalBoothUnits: number;
  sampleTotal: number;
  estimatedRetailSatang: number;
};

export function newEventId(): string {
  return `evt-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function clampDays(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DAYS;
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(n)));
}

/** Sum of booth units across all event days for one allocation. */
export function allocationTotal(a: EventAllocation): number {
  return a.days.reduce((sum, d) => sum + (Number.isFinite(d) ? d : 0), 0);
}

/** Resize a day array to `dayCount`, preserving existing values. */
function resizeDays(days: number[], dayCount: number): number[] {
  const next = days.slice(0, dayCount);
  while (next.length < dayCount) next.push(0);
  return next;
}

function emptyAllocation(productId: string, dayCount: number): EventAllocation {
  return { productId, days: Array(dayCount).fill(0), sample: 0 };
}

export function buildDraftFromCatalog(
  catalog: Product[],
  dayCount: number = DEFAULT_DAYS,
): EventSetup {
  const now = new Date().toISOString();
  const days = clampDays(dayCount);
  return {
    id: newEventId(),
    name: "",
    startDate: "",
    location: "",
    dayCount: days,
    allocations: catalog
      .filter((p) => p.is_active)
      .map((p) => emptyAllocation(p.id, days)),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Reconcile a stored setup against the live catalog: add allocations for new
 * active SKUs, drop allocations whose product disappeared, and normalise every
 * day array to `dayCount`. Returns the SAME reference when nothing changed so
 * callers can skip a redundant write.
 */
export function syncToCatalog(
  setup: EventSetup,
  catalog: Product[],
): EventSetup {
  const activeIds = catalog.filter((p) => p.is_active).map((p) => p.id);
  const byId = new Map(setup.allocations.map((a) => [a.productId, a]));

  let changed = false;
  const next: EventAllocation[] = activeIds.map((id) => {
    const existing = byId.get(id);
    if (!existing) {
      changed = true;
      return emptyAllocation(id, setup.dayCount);
    }
    if (existing.days.length !== setup.dayCount) {
      changed = true;
      return { ...existing, days: resizeDays(existing.days, setup.dayCount) };
    }
    return existing;
  });

  if (next.length !== setup.allocations.length) changed = true;
  if (!changed) return setup;
  return { ...setup, allocations: next };
}

/** Apply a new day count, resizing every allocation's day array. */
export function withDayCount(setup: EventSetup, dayCount: number): EventSetup {
  const days = clampDays(dayCount);
  if (days === setup.dayCount) return setup;
  return {
    ...setup,
    dayCount: days,
    allocations: setup.allocations.map((a) => ({
      ...a,
      days: resizeDays(a.days, days),
    })),
  };
}

export function computeEventSummary(
  setup: EventSetup,
  catalog: Product[],
): EventSummary {
  const priceById = new Map(catalog.map((p) => [p.id, p.price_satang]));
  let skusAllocated = 0;
  let totalBoothUnits = 0;
  let sampleTotal = 0;
  let estimatedRetailSatang = 0;

  for (const a of setup.allocations) {
    const booth = allocationTotal(a);
    if (booth > 0) skusAllocated += 1;
    totalBoothUnits += booth;
    sampleTotal += Number.isFinite(a.sample) ? a.sample : 0;
    estimatedRetailSatang += booth * (priceById.get(a.productId) ?? 0);
  }

  return { skusAllocated, totalBoothUnits, sampleTotal, estimatedRetailSatang };
}

export function readDemoEventSetup(): EventSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_EVENT_SETUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventSetup;
    return parsed && Array.isArray(parsed.allocations) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDemoEventSetup(setup: EventSetup | null): void {
  if (typeof window === "undefined") return;
  try {
    if (setup === null) {
      window.localStorage.removeItem(DEMO_EVENT_SETUP_KEY);
    } else {
      window.localStorage.setItem(DEMO_EVENT_SETUP_KEY, JSON.stringify(setup));
    }
  } catch {
    // quota / disabled — silent
  }
}

export function clearDemoEventSetup(): void {
  writeDemoEventSetup(null);
}
