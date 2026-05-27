"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import type { Product } from "@/lib/pos/types";
import {
  DEMO_CATALOG_KEY,
  newDemoProductId,
  readDemoCatalog,
  writeDemoCatalog,
} from "./catalog";

export function useDemoCatalog(): {
  items: Product[];
  ready: boolean;
  create: (p: Omit<Product, "id">) => string;
  update: (id: string, patch: Partial<Omit<Product, "id">>) => void;
  remove: (id: string) => void;
  setActive: (id: string, isActive: boolean) => void;
  replaceAll: (items: Product[]) => void;
  clear: () => void;
} {
  const [items, setItems] = useState<Product[]>(() =>
    typeof window !== "undefined" ? readDemoCatalog() : [],
  );
  const ready = useIsClient();

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_CATALOG_KEY) {
        setItems(readDemoCatalog());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const create = useCallback((p: Omit<Product, "id">) => {
    const id = newDemoProductId();
    const next = [...readDemoCatalog(), { ...p, id }];
    writeDemoCatalog(next);
    setItems(next);
    return id;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Omit<Product, "id">>) => {
      const next = readDemoCatalog().map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      );
      writeDemoCatalog(next);
      setItems(next);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const next = readDemoCatalog().filter((p) => p.id !== id);
    writeDemoCatalog(next);
    setItems(next);
  }, []);

  const setActive = useCallback((id: string, isActive: boolean) => {
    const next = readDemoCatalog().map((p) =>
      p.id === id ? { ...p, is_active: isActive } : p,
    );
    writeDemoCatalog(next);
    setItems(next);
  }, []);

  const replaceAll = useCallback((next: Product[]) => {
    writeDemoCatalog(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    writeDemoCatalog([]);
    setItems([]);
  }, []);

  return {
    items,
    ready,
    create,
    update,
    remove,
    setActive,
    replaceAll,
    clear,
  };
}
