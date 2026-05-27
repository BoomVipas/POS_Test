"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import {
  DEMO_STOCK_COUNT_KEY,
  buildSessionFromCatalog,
  clearDemoStockCounts,
  readDemoStockCounts,
  writeDemoStockCounts,
  type StockCountLine,
  type StockCountReason,
  type StockCountSession,
} from "./stock-count";
import type { Product } from "@/lib/pos/types";

export function useDemoStockCount(): {
  sessions: StockCountSession[];
  ready: boolean;
  open: (catalog: Product[]) => StockCountSession;
  setLineCount: (
    sessionId: string,
    productId: string,
    qty: number | null,
  ) => void;
  setLineReason: (
    sessionId: string,
    productId: string,
    reason: StockCountReason | undefined,
    note?: string,
  ) => void;
  setNotes: (sessionId: string, notes: string) => void;
  commit: (sessionId: string) => void;
  cancel: (sessionId: string) => void;
  clear: () => void;
} {
  const [sessions, setSessions] = useState<StockCountSession[]>(() =>
    typeof window !== "undefined" ? readDemoStockCounts() : [],
  );
  const ready = useIsClient();

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_STOCK_COUNT_KEY) {
        setSessions(readDemoStockCounts());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: StockCountSession[]) => {
    writeDemoStockCounts(next);
    setSessions(next);
  }, []);

  const open = useCallback(
    (catalog: Product[]) => {
      const session = buildSessionFromCatalog(catalog);
      const next = [session, ...readDemoStockCounts()];
      persist(next);
      return session;
    },
    [persist],
  );

  const updateSession = useCallback(
    (
      sessionId: string,
      mutator: (s: StockCountSession) => StockCountSession,
    ) => {
      const all = readDemoStockCounts();
      const next = all.map((s) => (s.id === sessionId ? mutator(s) : s));
      persist(next);
    },
    [persist],
  );

  const setLineCount = useCallback(
    (sessionId: string, productId: string, qty: number | null) => {
      updateSession(sessionId, (s) => ({
        ...s,
        lines: s.lines.map((l) =>
          l.productId === productId ? { ...l, countedQty: qty } : l,
        ),
      }));
    },
    [updateSession],
  );

  const setLineReason = useCallback(
    (
      sessionId: string,
      productId: string,
      reason: StockCountReason | undefined,
      note?: string,
    ) => {
      updateSession(sessionId, (s) => ({
        ...s,
        lines: s.lines.map((l): StockCountLine =>
          l.productId === productId
            ? {
                ...l,
                reason,
                reasonNote: note,
              }
            : l,
        ),
      }));
    },
    [updateSession],
  );

  const setNotes = useCallback(
    (sessionId: string, notes: string) => {
      updateSession(sessionId, (s) => ({ ...s, notes }));
    },
    [updateSession],
  );

  const commit = useCallback(
    (sessionId: string) => {
      updateSession(sessionId, (s) => ({
        ...s,
        status: "committed",
        closedAt: new Date().toISOString(),
      }));
    },
    [updateSession],
  );

  const cancel = useCallback(
    (sessionId: string) => {
      updateSession(sessionId, (s) => ({
        ...s,
        status: "cancelled",
        closedAt: new Date().toISOString(),
      }));
    },
    [updateSession],
  );

  const clear = useCallback(() => {
    clearDemoStockCounts();
    setSessions([]);
  }, []);

  return {
    sessions,
    ready,
    open,
    setLineCount,
    setLineReason,
    setNotes,
    commit,
    cancel,
    clear,
  };
}
