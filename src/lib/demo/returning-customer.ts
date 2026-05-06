// Wave 40c — Returning-customer lookup helper.
//
// Aggregates two sources of "have we seen this customer before?" signal:
//   1. Past sales (useDemoCustomers / deriveCustomerProfiles). The customer
//      paid before, so a phone may be on file from CustomerInfoBlock.
//   2. Portal registrations (useDemoCustomerTokens.portalCustomers). The
//      customer scanned the receipt QR and registered themselves + their pet
//      AFTER an earlier sale.
//
// At the booth on a return visit, the cashier types the phone and the POS
// surfaces both signals together: name, last purchase, pet preview, allergy
// hints. That's the moat in action — generic POS doesn't store the pet, and
// the booth-seller's repeat-customer conversation IS about the pet.

import type { CustomerProfile } from "./customers";
import { phoneKey, findCustomerByPhone } from "./customers";
import type { DemoOrder } from "./sales";
import type { DemoPortalCustomer } from "./customer-tokens";

export type ReturningCustomerMatch = {
  /** Canonicalized phone (8–10 digits) used as the join key. */
  phoneKey: string;
  /** As-entered phone for display. */
  phoneDisplay: string;
  /** Name, preferring portal-registered display name over legacy sales-derived. */
  name: string | null;
  email: string | null;
  /** Address from past send-later orders, if any. */
  address: string | null;
  /** Past sales summary; null if no sales on file. */
  pastSales: {
    orderCount: number;
    totalSatang: number;
    lastSeenAt: string;
    pointsAvailable: number;
  } | null;
  /** Portal registration; null if customer never scanned a receipt. */
  portal: {
    customerId: string;
    registeredAt: string;
    consentMarketing: boolean;
    pets: DemoPortalCustomer["pets"];
  } | null;
  /** Last 1-3 product names (most recent order first). For a quick "you
   *  bought X last time" prompt to the cashier. */
  lastProductNames: string[];
};

function pickPhoneFromContacts(
  c: DemoPortalCustomer,
): { phoneKey: string; raw: string } | null {
  const phoneContact = c.contacts.find(
    (k) => k.channel === "phone" && k.value.trim().length > 0,
  );
  if (!phoneContact) return null;
  const k = phoneKey(phoneContact.value);
  return k ? { phoneKey: k, raw: phoneContact.value } : null;
}

/** Pure: produce the best match given a phone and the two source arrays. */
export function lookupReturningCustomer(
  phone: string,
  orders: DemoOrder[],
  portalCustomers: DemoPortalCustomer[],
): ReturningCustomerMatch | null {
  const k = phoneKey(phone);
  if (!k) return null;

  const past = findCustomerByPhone(orders, phone);
  const portalMatch = portalCustomers.find((c) => {
    const p = pickPhoneFromContacts(c);
    return p?.phoneKey === k;
  });

  if (!past && !portalMatch) return null;

  const recentOrders = orders
    .filter((o) => {
      if ((o.status ?? "completed") === "voided") return false;
      return phoneKey(o.customerPhone) === k;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 1);
  const lastProductNames = recentOrders[0]
    ? recentOrders[0].items.slice(0, 3).map((it) => it.productName)
    : [];

  return {
    phoneKey: k,
    phoneDisplay: phone,
    name:
      portalMatch?.displayName?.trim() ||
      past?.name ||
      null,
    email:
      past?.email ||
      portalMatch?.contacts.find((c) => c.channel === "email")?.value ||
      null,
    address: past?.address ?? null,
    pastSales: past
      ? {
          orderCount: past.orderCount,
          totalSatang: past.totalSatang,
          lastSeenAt: past.lastSeenAt,
          pointsAvailable: past.pointsAvailable,
        }
      : null,
    portal: portalMatch
      ? {
          customerId: portalMatch.id,
          registeredAt: portalMatch.registeredAt,
          consentMarketing: portalMatch.consentMarketing,
          pets: portalMatch.pets,
        }
      : null,
    lastProductNames,
  };
}

/** Pure helper for tests & the cashier "is this customer recognized?" badge. */
export function hasRecognizedCustomer(
  match: ReturningCustomerMatch | null,
): boolean {
  return Boolean(match && (match.pastSales || match.portal));
}

/** Hands a CustomerProfile-shaped object back so the cashier can attach to
 *  the cart store via SET_CUSTOMER without separate data plumbing.
 *  The portal/past data takes precedence over manually-entered cart fields. */
export function matchToCustomerPatch(
  match: ReturningCustomerMatch,
): { name: string; phone: string; email: string; address: string } {
  return {
    name: match.name ?? "",
    phone: match.phoneDisplay,
    email: match.email ?? "",
    address: match.address ?? "",
  };
}

/** Re-export for one-stop import in components. */
export type { CustomerProfile };
