"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import {
  DEMO_SAMPLE_BUCKET_KEY,
  clearSampleBuckets,
  convertEventToSample as pureMakeSample,
  convertSampleToEvent as pureReturnSample,
  readSampleBuckets,
  rowQty,
  writeSampleBuckets,
  type ConvertResult,
  type SampleBucketRow,
} from "./sample-bucket";

/**
 * Demo-mode hook for the sample bucket model (Wave 39b).
 *
 * Mirrors the pattern used by useDemoPets / useDemoClaims / useDemoCustomerTokens:
 * localStorage-backed, cross-tab via storage event. When real Supabase wires
 * up post-Wave-39a, this hook gets replaced by a Server-Action shadow that
 * calls convert_event_to_sample / convert_sample_to_event RPCs.
 */
export function useDemoSampleBucket(): {
  rows: SampleBucketRow[];
  ready: boolean;
  qtyFor: (eventId: string, productId: string) => number;
  make: (
    eventId: string,
    productId: string,
    qty: number,
    availableEventQty: number,
    reason?: string,
  ) => ConvertResult;
  returnToEvent: (
    eventId: string,
    productId: string,
    qty: number,
    reason?: string,
  ) => ConvertResult;
  clear: () => void;
} {
  const [rows, setRows] = useState<SampleBucketRow[]>(() =>
    typeof window !== "undefined" ? readSampleBuckets() : [],
  );
  const ready = useIsClient();

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_SAMPLE_BUCKET_KEY) {
        setRows(readSampleBuckets());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const qtyFor = useCallback(
    (eventId: string, productId: string) => rowQty(rows, eventId, productId),
    [rows],
  );

  const make = useCallback(
    (
      eventId: string,
      productId: string,
      qty: number,
      availableEventQty: number,
      reason?: string,
    ) => {
      const current = readSampleBuckets();
      const result = pureMakeSample(
        current,
        eventId,
        productId,
        qty,
        availableEventQty,
        reason,
      );
      if (result.ok) {
        writeSampleBuckets(result.rows);
        setRows(result.rows);
      }
      return result;
    },
    [],
  );

  const returnToEvent = useCallback(
    (eventId: string, productId: string, qty: number, reason?: string) => {
      const current = readSampleBuckets();
      const result = pureReturnSample(current, eventId, productId, qty, reason);
      if (result.ok) {
        writeSampleBuckets(result.rows);
        setRows(result.rows);
      }
      return result;
    },
    [],
  );

  const clear = useCallback(() => {
    clearSampleBuckets();
    setRows([]);
  }, []);

  return { rows, ready, qtyFor, make, returnToEvent, clear };
}
