"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/pos/types";
import {
  DEMO_EVENT_SETUP_KEY,
  buildDraftFromCatalog,
  clearDemoEventSetup,
  readDemoEventSetup,
  syncToCatalog,
  withDayCount,
  writeDemoEventSetup,
  type EventSetup,
} from "./event-setup";

export function useDemoEventSetup(): {
  setup: EventSetup | null;
  ready: boolean;
  ensureDraft: (catalog: Product[]) => void;
  setName: (name: string) => void;
  setStartDate: (date: string) => void;
  setLocation: (location: string) => void;
  setDayCount: (dayCount: number) => void;
  setDayQty: (productId: string, dayIndex: number, qty: number) => void;
  setSample: (productId: string, qty: number) => void;
  reset: () => void;
} {
  const [setup, setSetup] = useState<EventSetup | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSetup(readDemoEventSetup());
    setReady(true);
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_EVENT_SETUP_KEY) {
        setSetup(readDemoEventSetup());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: EventSetup | null) => {
    writeDemoEventSetup(next);
    setSetup(next);
  }, []);

  // Touch updatedAt on every mutation.
  const patch = useCallback(
    (mutator: (s: EventSetup) => EventSetup) => {
      setSetup((prev) => {
        if (!prev) return prev;
        const next = mutator(prev);
        if (next === prev) return prev;
        const stamped = { ...next, updatedAt: new Date().toISOString() };
        writeDemoEventSetup(stamped);
        return stamped;
      });
    },
    [],
  );

  const ensureDraft = useCallback(
    (catalog: Product[]) => {
      setSetup((prev) => {
        if (!prev) {
          const draft = buildDraftFromCatalog(catalog);
          writeDemoEventSetup(draft);
          return draft;
        }
        const synced = syncToCatalog(prev, catalog);
        if (synced === prev) return prev;
        writeDemoEventSetup(synced);
        return synced;
      });
    },
    [],
  );

  const setName = useCallback(
    (name: string) => patch((s) => ({ ...s, name })),
    [patch],
  );
  const setStartDate = useCallback(
    (startDate: string) => patch((s) => ({ ...s, startDate })),
    [patch],
  );
  const setLocation = useCallback(
    (location: string) => patch((s) => ({ ...s, location })),
    [patch],
  );
  const setDayCount = useCallback(
    (dayCount: number) => patch((s) => withDayCount(s, dayCount)),
    [patch],
  );

  const setDayQty = useCallback(
    (productId: string, dayIndex: number, qty: number) =>
      patch((s) => ({
        ...s,
        allocations: s.allocations.map((a) =>
          a.productId === productId
            ? {
                ...a,
                days: a.days.map((d, i) =>
                  i === dayIndex ? Math.max(0, Math.round(qty) || 0) : d,
                ),
              }
            : a,
        ),
      })),
    [patch],
  );

  const setSample = useCallback(
    (productId: string, qty: number) =>
      patch((s) => ({
        ...s,
        allocations: s.allocations.map((a) =>
          a.productId === productId
            ? { ...a, sample: Math.max(0, Math.round(qty) || 0) }
            : a,
        ),
      })),
    [patch],
  );

  const reset = useCallback(() => {
    clearDemoEventSetup();
    setSetup(null);
  }, []);

  return {
    setup,
    ready,
    ensureDraft,
    setName,
    setStartDate,
    setLocation,
    setDayCount,
    setDayQty,
    setSample,
    reset,
  };
}
