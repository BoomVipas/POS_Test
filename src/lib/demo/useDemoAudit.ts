"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEMO_AUDIT_KEY,
  appendDemoAudit,
  clearDemoAudit,
  readDemoAudit,
  type DemoAuditEntry,
} from "./audit";

export function useDemoAudit(): {
  entries: DemoAuditEntry[];
  ready: boolean;
  log: (entry: Omit<DemoAuditEntry, "id" | "createdAt">) => void;
  clear: () => void;
} {
  const [entries, setEntries] = useState<DemoAuditEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(readDemoAudit());
    setReady(true);
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_AUDIT_KEY) {
        setEntries(readDemoAudit());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const log = useCallback(
    (entry: Omit<DemoAuditEntry, "id" | "createdAt">) => {
      appendDemoAudit(entry);
      setEntries(readDemoAudit());
    },
    [],
  );

  const clear = useCallback(() => {
    clearDemoAudit();
    setEntries([]);
  }, []);

  return { entries, ready, log, clear };
}
