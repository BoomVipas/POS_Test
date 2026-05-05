"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEMO_PETS_KEY,
  clearDemoPets,
  newPetId,
  petsForPhoneKey,
  readDemoPets,
  writeDemoPets,
  type DemoPet,
} from "./pets";
import { phoneKey as canonicalKey } from "./customers";

export function useDemoPets(): {
  pets: DemoPet[];
  ready: boolean;
  forPhone: (phone: string) => DemoPet[];
  add: (
    phone: string,
    fields: Omit<
      DemoPet,
      "id" | "customerPhoneKey" | "createdAt" | "updatedAt"
    >,
  ) => DemoPet | null;
  update: (
    id: string,
    patch: Partial<Omit<DemoPet, "id" | "customerPhoneKey" | "createdAt">>,
  ) => void;
  remove: (id: string) => void;
  clear: () => void;
} {
  const [pets, setPets] = useState<DemoPet[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPets(readDemoPets());
    setReady(true);
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_PETS_KEY) {
        setPets(readDemoPets());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const forPhone = useCallback(
    (phone: string) => {
      const k = canonicalKey(phone);
      if (!k) return [];
      return petsForPhoneKey(pets, k);
    },
    [pets],
  );

  const add = useCallback(
    (
      phone: string,
      fields: Omit<
        DemoPet,
        "id" | "customerPhoneKey" | "createdAt" | "updatedAt"
      >,
    ): DemoPet | null => {
      const k = canonicalKey(phone);
      if (!k) return null;
      const now = new Date().toISOString();
      const pet: DemoPet = {
        ...fields,
        id: newPetId(),
        customerPhoneKey: k,
        createdAt: now,
        updatedAt: now,
      };
      const next = [...readDemoPets(), pet];
      writeDemoPets(next);
      setPets(next);
      return pet;
    },
    [],
  );

  const update = useCallback(
    (
      id: string,
      patch: Partial<Omit<DemoPet, "id" | "customerPhoneKey" | "createdAt">>,
    ) => {
      const now = new Date().toISOString();
      const next = readDemoPets().map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: now } : p,
      );
      writeDemoPets(next);
      setPets(next);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const next = readDemoPets().filter((p) => p.id !== id);
    writeDemoPets(next);
    setPets(next);
  }, []);

  const clear = useCallback(() => {
    clearDemoPets();
    setPets([]);
  }, []);

  return { pets, ready, forPhone, add, update, remove, clear };
}
