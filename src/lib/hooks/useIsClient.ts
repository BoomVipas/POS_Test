"use client";

import { useSyncExternalStore } from "react";

// Returns false during SSR and on the initial server-rendered HTML; true once
// the client has hydrated. Uses useSyncExternalStore so React handles the
// server→client mismatch gracefully without a setState-in-effect call.
const noopSubscribe = () => () => {};

export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
