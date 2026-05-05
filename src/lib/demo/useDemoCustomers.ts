"use client";

import { useDemoSales } from "./useDemoSales";
import {
  findCustomerByPhone,
  deriveCustomerProfiles,
  type CustomerProfile,
} from "./customers";

export function useDemoCustomers(): {
  ready: boolean;
  findByPhone: (phone: string) => CustomerProfile | null;
  all: () => CustomerProfile[];
} {
  const { orders, ready } = useDemoSales();

  return {
    ready,
    findByPhone(phone: string) {
      return findCustomerByPhone(orders, phone);
    },
    all() {
      return [...deriveCustomerProfiles(orders).values()].sort(
        (a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt),
      );
    },
  };
}
