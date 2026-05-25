"use client";

import { createContext, useContext, type ReactNode } from "react";

// DD-65 — tells the POS whether it's running against real Supabase data (and for
// which workspace/event) or the demo localStorage sandbox. Set once at the POS
// workspace root; the ReviewModal reads it to pick the demo vs. create_order
// confirm path.
export type POSMode =
  | { mode: "demo" }
  | { mode: "live"; workspaceId: string; eventId: string | null };

const POSModeContext = createContext<POSMode>({ mode: "demo" });

export function POSModeProvider({
  value,
  children,
}: {
  value: POSMode;
  children: ReactNode;
}) {
  return (
    <POSModeContext.Provider value={value}>{children}</POSModeContext.Provider>
  );
}

export function usePOSMode(): POSMode {
  return useContext(POSModeContext);
}
