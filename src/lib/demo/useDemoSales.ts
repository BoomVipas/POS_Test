"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEMO_SALES_KEY,
  appendDemoSale,
  clearDemoSales,
  readDemoSales,
  type DemoOrder,
} from "./sales";

export function useDemoSales(): {
  orders: DemoOrder[];
  ready: boolean;
  append: (order: DemoOrder) => void;
  clear: () => void;
} {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOrders(readDemoSales());
    setReady(true);
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

  const clear = useCallback(() => {
    clearDemoSales();
    setOrders([]);
  }, []);

  return { orders, ready, append, clear };
}
