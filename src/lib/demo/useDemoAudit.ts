"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
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
  const [entries, setEntries] = useState<DemoAuditEntry[]>(() =>
    typeof window !== "undefined" ? readDemoAudit() : [],
  );
  const ready = useIsClient();

  useEffect(() => {
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
