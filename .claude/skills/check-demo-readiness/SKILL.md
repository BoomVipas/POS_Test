---
name: check-demo-readiness
description: Audit which MochiPOS app pages are still in demo mode (reading from localStorage via useDemoX hooks) vs wired to live Supabase data. Run before a customer demo or expo deadline to identify remaining wiring gaps. Invoke when the user asks "what's still demo?", "what's not live yet?", or before a milestone like the Pet Expo Championship 2026 (Jul 30–Aug 2).
user-invocable: true
---

# Demo-readiness audit

Scans `src/app/app/` for pages still on localStorage and reports which are wired vs pending.

## Run this scan

```bash
# Pages that import demo hooks (still on localStorage):
grep -rn "useDemoCatalog\|useDemoSales\|useDemoAudit\|useDemoSettings\|useDemoCloseDay\|useDemoPreOrders\|useDemoStockCount\|useDemoSampleBucket\|useDemoPets\|useDemoClaims\|useDemoCustomerNotes\|useDemoCustomerTokens\|useDemoEventSetup" \
  src/app/app --include="*.tsx" -l | sort

# Pages with isConfigured() guard (already wired or partially wired):
grep -rl "isConfigured" src/app/app --include="*.tsx" | sort
```

## Current status (as of 2026-05-27, after Waves 51–57)

### ✅ Wired to Supabase
| Page | Wave | Notes |
|------|------|-------|
| `/app` (dashboard) | Wave 51 (#110) | DashboardConfiguredServer, getTodayStats etc. |
| `/app/pos` | DD-65 | create_order RPC, event_inventory |
| `/app/events` | — | EventsConfiguredServer |
| `/app/setup/products` | — | CatalogManagerLive |
| `/app/close-day` | DD-92 | close_day RPC |
| `/app/send-later` | — | SendLaterQueueLive |
| `/app/correction` | — | CorrectionListLive |
| `/app/inventory/samples` | — | SampleBucketManagerLive |
| `/app/audit-log` | Wave 55 (#135) | AuditLogConfiguredServer, ?action= filter |
| `/app/customers` | Wave 56 (#137) | CustomersConfiguredServer, ?stage= filter |

### ⚠️ Still demo-only (localStorage)
| Page | Hook(s) used | Effort | Priority |
|------|-------------|--------|----------|
| `/app/stock-count` | useDemoStockCount, useDemoCatalog | Medium | Low (not on golden path) |
| `/app/pre-orders` | useDemoPreOrders | Medium | Low (feature not fully designed for live) |

### 🟡 Demo fallback present but live path exists
All pages above in the "Wired" list still render the demo component when `NEXT_PUBLIC_SUPABASE_URL` is unset — this is intentional for local dev without Supabase.

## Golden path (what matters for the customer walkthrough)
Landing → Apply → Invite link → Google sign-in → Workspace → **Catalog (products)** → **Events (allocate stock)** → **POS (create sale)** → **Receipt** → **Dashboard (live data)** → **Customers** → **Audit log**

All golden path pages are Supabase-wired. ✅

## Next wiring candidates (in priority order)
1. `/app/stock-count` — calls `adjust_event_stock` RPC (already exists); needs `StockCountConfiguredServer` pattern
2. `/app/pre-orders` — no live RPC yet; design first

## Before each demo
1. Run `npm run lint` → must be 0 problems
2. Run `npm test` → must be all passing
3. Confirm `product-images` Storage bucket exists in Supabase dashboard (one-time setup — enables product photo uploads in ProductFormLive)
4. Verify Supabase Google Auth provider is enabled (see `docs/GOOGLE_AUTH_SETUP.md`)
