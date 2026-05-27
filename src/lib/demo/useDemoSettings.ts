"use client";

import { useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import {
  readDemoSettings,
  writeDemoSettings,
  type DemoSettings,
} from "./settings";

export function useDemoSettings(): {
  settings: DemoSettings;
  save: (next: DemoSettings) => void;
  ready: boolean;
} {
  const [settings, setSettings] = useState<DemoSettings>(() =>
    readDemoSettings(),
  );
  const ready = useIsClient();

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key.startsWith("pos-for-sell:demo-settings")) {
        setSettings(readDemoSettings());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function save(next: DemoSettings) {
    setSettings(next);
    writeDemoSettings(next);
  }

  return { settings, save, ready };
}
