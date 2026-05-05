"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_TTL_MINUTES,
  DEMO_CLAIMS_KEY,
  clearClaims,
  findRedeemableClaim,
  generateUniqueCode,
  newClaimId,
  readClaims,
  writeClaims,
  type DemoClaim,
} from "./qr-claims";
import type { CartLine } from "@/lib/pos/types";

export function useDemoClaims(): {
  claims: DemoClaim[];
  ready: boolean;
  create: (input: { lines: CartLine[]; customerName: string }) => DemoClaim;
  redeem: (code: string) => DemoClaim | null;
  cancel: (id: string) => void;
  clear: () => void;
} {
  const [claims, setClaims] = useState<DemoClaim[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setClaims(readClaims());
    setReady(true);
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_CLAIMS_KEY) {
        setClaims(readClaims());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const create = useCallback(
    (input: { lines: CartLine[]; customerName: string }): DemoClaim => {
      const all = readClaims();
      const code = generateUniqueCode(all);
      const now = new Date();
      const expires = new Date(now.getTime() + DEFAULT_TTL_MINUTES * 60_000);
      const claim: DemoClaim = {
        id: newClaimId(),
        code,
        lines: input.lines,
        customerName: input.customerName.trim(),
        status: "open",
        createdAt: now.toISOString(),
        redeemedAt: null,
        expiresAt: expires.toISOString(),
      };
      const next = [claim, ...all];
      writeClaims(next);
      setClaims(next);
      return claim;
    },
    [],
  );

  const redeem = useCallback((code: string): DemoClaim | null => {
    const all = readClaims();
    const target = findRedeemableClaim(all, code);
    if (!target) return null;
    const now = new Date().toISOString();
    const next = all.map((c) =>
      c.id === target.id
        ? { ...c, status: "redeemed" as const, redeemedAt: now }
        : c,
    );
    writeClaims(next);
    setClaims(next);
    return { ...target, status: "redeemed", redeemedAt: now };
  }, []);

  const cancel = useCallback((id: string) => {
    const next = readClaims().map((c) =>
      c.id === id ? { ...c, status: "cancelled" as const } : c,
    );
    writeClaims(next);
    setClaims(next);
  }, []);

  const clear = useCallback(() => {
    clearClaims();
    setClaims([]);
  }, []);

  return { claims, ready, create, redeem, cancel, clear };
}
