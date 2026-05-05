"use client";

import { useEffect, useState } from "react";
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
  const [ready, setReady] = useState(false);

  // Re-read on mount so server-render and post-hydration values stay in sync.
  useEffect(() => {
    setSettings(readDemoSettings());
    setReady(true);

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
