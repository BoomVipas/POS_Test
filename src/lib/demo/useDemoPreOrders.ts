"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import {
  DEMO_PRE_ORDERS_KEY,
  clearDemoPreOrders,
  newPreOrderId,
  readDemoPreOrders,
  writeDemoPreOrders,
  type DemoPreOrder,
  type PreOrderStatus,
} from "./pre-orders";

export function useDemoPreOrders(): {
  items: DemoPreOrder[];
  ready: boolean;
  create: (input: Omit<DemoPreOrder, "id" | "status" | "createdAt" | "updatedAt">) => string;
  setStatus: (id: string, status: PreOrderStatus) => void;
  clear: () => void;
} {
  const [items, setItems] = useState<DemoPreOrder[]>(() =>
    typeof window !== "undefined" ? readDemoPreOrders() : [],
  );
  const ready = useIsClient();

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_PRE_ORDERS_KEY) {
        setItems(readDemoPreOrders());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const create = useCallback(
    (
      input: Omit<DemoPreOrder, "id" | "status" | "createdAt" | "updatedAt">,
    ) => {
      const id = newPreOrderId();
      const now = new Date().toISOString();
      const next: DemoPreOrder = {
        ...input,
        id,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      const all = [...readDemoPreOrders(), next];
      writeDemoPreOrders(all);
      setItems(all);
      return id;
    },
    [],
  );

  const setStatus = useCallback((id: string, status: PreOrderStatus) => {
    const now = new Date().toISOString();
    const all = readDemoPreOrders().map((p) =>
      p.id === id ? { ...p, status, updatedAt: now } : p,
    );
    writeDemoPreOrders(all);
    setItems(all);
  }, []);

  const clear = useCallback(() => {
    clearDemoPreOrders();
    setItems([]);
  }, []);

  return { items, ready, create, setStatus, clear };
}
