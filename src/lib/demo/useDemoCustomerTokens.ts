"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import {
  DEMO_CUSTOMER_TOKENS_KEY,
  DEMO_PORTAL_CUSTOMERS_KEY,
  applyClaim,
  buildToken,
  clearAll,
  readPortalCustomers,
  readTokens,
  validateToken,
  writePortalCustomers,
  writeTokens,
  type ClaimPayload,
  type ClaimResult,
  type DemoCustomerToken,
  type DemoPortalCustomer,
} from "./customer-tokens";

/**
 * Demo-mode store for the post-purchase Customer Portal flow (Wave 40b).
 *
 * Two localStorage keys: tokens + registered customers. The cashier creates a
 * token at sale completion; the customer redeems it on /register/[token].
 *
 * When Wave 40a (PR #5) merges + Supabase is provisioned, the
 * `useDemoCustomerTokens` import sites swap to a Supabase-backed hook that
 * calls `create_registration_token` / `claim_registration_token` RPCs. The
 * shape stays the same.
 */
export function useDemoCustomerTokens(): {
  tokens: DemoCustomerToken[];
  portalCustomers: DemoPortalCustomer[];
  ready: boolean;
  /** Cashier action: issue a token for a completed order. */
  create: (orderId: string) => DemoCustomerToken;
  /** Server-action shadow: validate a token without claiming. */
  validate: (tokenString: string) => ReturnType<typeof validateToken>;
  /** Customer-portal action: claim a token + write the customer + pets. */
  claim: (tokenString: string, payload: ClaimPayload) => ClaimResult;
  /** Lookup helpers. */
  forOrder: (orderId: string) => DemoCustomerToken[];
  registeredForOrder: (orderId: string) => DemoPortalCustomer[];
  clear: () => void;
} {
  const [tokens, setTokens] = useState<DemoCustomerToken[]>(() =>
    typeof window !== "undefined" ? readTokens() : [],
  );
  const [portalCustomers, setPortalCustomers] = useState<DemoPortalCustomer[]>(
    () => (typeof window !== "undefined" ? readPortalCustomers() : []),
  );
  const ready = useIsClient();

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (
        e.key === null ||
        e.key === DEMO_CUSTOMER_TOKENS_KEY ||
        e.key === DEMO_PORTAL_CUSTOMERS_KEY
      ) {
        setTokens(readTokens());
        setPortalCustomers(readPortalCustomers());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const create = useCallback((orderId: string) => {
    const row = buildToken(orderId);
    const next = [row, ...readTokens().filter((t) => t.id !== row.id)];
    writeTokens(next);
    setTokens(next);
    return row;
  }, []);

  const validate = useCallback(
    (tokenString: string) => validateToken(tokens, tokenString),
    [tokens],
  );

  const claim = useCallback(
    (tokenString: string, payload: ClaimPayload): ClaimResult => {
      const result = applyClaim(
        readTokens(),
        readPortalCustomers(),
        tokenString,
        payload,
      );
      if (result.ok) {
        if (result.tokens && result.customers) {
          writeTokens(result.tokens);
          writePortalCustomers(result.customers);
          setTokens(result.tokens);
          setPortalCustomers(result.customers);
        }
        return { ok: true, customer: result.customer };
      }
      return { ok: false, reason: result.reason };
    },
    [],
  );

  const forOrder = useCallback(
    (orderId: string) => tokens.filter((t) => t.orderId === orderId),
    [tokens],
  );

  const registeredForOrder = useCallback(
    (orderId: string) =>
      portalCustomers.filter((c) => c.orderId === orderId),
    [portalCustomers],
  );

  const clearStore = useCallback(() => {
    clearAll();
    setTokens([]);
    setPortalCustomers([]);
  }, []);

  return {
    tokens,
    portalCustomers,
    ready,
    create,
    validate,
    claim,
    forOrder,
    registeredForOrder,
    clear: clearStore,
  };
}
