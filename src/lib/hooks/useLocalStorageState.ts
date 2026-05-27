"use client";

import { useCallback, useState } from "react";

/**
 * Persist a small piece of UI state in localStorage.
 *
 * IMPORTANT: never use this for business data (orders, products, payments,
 * inventory). Use it only for UI-state that's safe to lose: open/closed panels,
 * last-viewed-day picker, draft form values.
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // ignore parse errors and fall back to initial
    }
    return initial;
  });

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          }
        } catch {
          // quota exceeded etc — silently drop persistence
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}
