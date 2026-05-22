# Mochi UI pass — 2026-05-22 13:58

## Business meaning
Makes the POS look and feel production-grade for the **5-seller pilot** — credible, consistent, and safe — **without touching checkout logic**:

- **Fewer cashier mistakes** — destructive actions (delete product, void/correct a sale, reset demo data, cancel a fulfilment/pre-order) now confirm in a clear **named dialog** instead of a bare browser popup.
- **Trust / professionalism** — cohesive indigo depth, hover/press feedback, premium page titles, and unified focus rings make it read like real, polished software (lowers the "is this legit?" doubt with pilot sellers).
- **Lower booth training burden** — branded loading skeletons and illustrated empty states tell staff what's happening and what to do next.
- **At-a-glance owner view** — the dashboard "Today's takings" gradient hero + sparkline surface the day's numbers fast.
- **Booth planning UI** — the new event-setup screen (booth rules + free-gift). *Demo/config only; it does not drive checkout yet.*

All changes are **visual/UI-only** — no checkout or workflow behaviour changed. Shipped via PR #84 (ConfirmDialog/UX), #85 (beauty pass + cleanup), #83 (event setup).

## Screenshots
| File | Screen | What it shows |
|---|---|---|
| `01-apphome-hover.png` | App home | Launcher tile hover lifts with an indigo border + shadow (micro-interactions, #85) |
| `02-pos-hover.png` | POS | Image-less product cards show a 2-letter monogram (doubled-name fix) + cohesive indigo card shadows (#85) |
| `03-dashboard-hero.png` | Dashboard | Full-width indigo gradient "Today's takings" hero + sparkline trend, above the orders / margin / avg-bill strip (#85) |
| `04-confirmdialog.png` | Settings | Named `ConfirmDialog` ("Keep data" vs red "Reset everything") replacing the bare browser `confirm()` (#84) |
| `05-empty-state.png` | Customers | Illustrated empty state: lucide `PawPrint` icon in a soft lavender circle + a next-action CTA (#85) |
| `06-loading-skeleton.png` | Customers | Branded `ListSkeleton` shimmer replacing bare "Loading…" text (#85) |
| `07-input-focus.png` | Close day | Unified indigo focus ring on data-entry inputs (#85) |
| `08-success-badge.png` | Checkout success | Polished checkmark badge (soft ring + shadow) + heavier title. Shown via the order-not-found state, which shares the badge; the live success screen adds a "Sale complete" eyebrow + order summary (#85) |
| `09-events.png` | Event setup | Booth-rule toggles, free-gift rule, stock allocator. NOTE: demo/config only — does not drive POS checkout yet (#83) |

_Regenerate per `../README.md`._
