"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEMO_CUSTOMER_NOTES_KEY,
  clearCustomerNotes,
  getNoteByPhone,
  readCustomerNotes,
  setNoteByPhone,
  type DemoCustomerNote,
} from "./customer-notes";

export function useDemoCustomerNotes(): {
  ready: boolean;
  get: (phone: string) => DemoCustomerNote | null;
  set: (phone: string, patch: Partial<DemoCustomerNote>) => void;
  clear: () => void;
} {
  const [store, setStore] = useState<Record<string, DemoCustomerNote>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(readCustomerNotes());
    setReady(true);
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_CUSTOMER_NOTES_KEY) {
        setStore(readCustomerNotes());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const get = useCallback(
    (phone: string) => getNoteByPhone(store, phone),
    [store],
  );

  const set = useCallback(
    (phone: string, patch: Partial<DemoCustomerNote>) => {
      const next = setNoteByPhone(store, phone, patch);
      setStore(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          DEMO_CUSTOMER_NOTES_KEY,
          JSON.stringify(next),
        );
      }
    },
    [store],
  );

  const clear = useCallback(() => {
    clearCustomerNotes();
    setStore({});
  }, []);

  return { ready, get, set, clear };
}
