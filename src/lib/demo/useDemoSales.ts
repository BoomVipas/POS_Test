"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import {
  DEMO_SALES_KEY,
  appendDemoSale,
  clearDemoSales,
  readDemoSales,
  updateDemoSale,
  type DemoOrder,
} from "./sales";

export function useDemoSales(): {
  orders: DemoOrder[];
  ready: boolean;
  append: (order: DemoOrder) => void;
  update: (
    id: string,
    patch: Partial<Omit<DemoOrder, "id" | "items" | "createdAt">>,
  ) => void;
  clear: () => void;
} {
  const [orders, setOrders] = useState<DemoOrder[]>(() =>
    typeof window !== "undefined" ? readDemoSales() : [],
  );
  const ready = useIsClient();

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_SALES_KEY) {
        setOrders(readDemoSales());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const append = useCallback((order: DemoOrder) => {
    appendDemoSale(order);
    setOrders(readDemoSales());
  }, []);

  const update = useCallback(
    (
      id: string,
      patch: Partial<Omit<DemoOrder, "id" | "items" | "createdAt">>,
    ) => {
      updateDemoSale(id, patch);
      setOrders(readDemoSales());
    },
    [],
  );

  const clear = useCallback(() => {
    clearDemoSales();
    setOrders([]);
  }, []);

  return { orders, ready, append, update, clear };
}
