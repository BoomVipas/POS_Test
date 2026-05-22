# Mochi UI pass — 2026-05-22

Visual record of the Mochi UI work merged to `main`: **PR #84** (destructive-action ConfirmDialog + UX polish), **PR #85** (full beauty pass + cleanup), **PR #83** (event-setup screen). Demo mode, full-page captures.

| # | File | Screen | What it shows |
|---|---|---|---|
| 01 | `01-apphome-hover.png` | App home | Launcher tile hover lifts with an indigo border + shadow — hover/press micro-interactions (#85) |
| 02 | `02-pos-hover.png` | POS | Product cards show a 2-letter monogram for image-less items (doubled-name fix) + cohesive cool-indigo card shadows (#85) |
| 03 | `03-dashboard-hero.png` | Dashboard | Full-width indigo gradient "Today's takings" hero + white sparkline trend, above the orders / margin / avg-bill strip (#85) |
| 04 | `04-confirmdialog.png` | Settings | Named `ConfirmDialog` ("Keep data" vs red "Reset everything") replacing the bare browser `confirm()` (#84) |
| 05 | `05-empty-state.png` | Customers | Illustrated empty state: a lucide `PawPrint` icon in a soft lavender circle + a next-action CTA (#85) |
| 06 | `06-loading-skeleton.png` | Customers | Branded `ListSkeleton` shimmer replacing bare "Loading…" text (#85) |
| 07 | `07-input-focus.png` | Close day | Unified indigo focus ring on data-entry inputs (#85) |
| 08 | `08-success-badge.png` | Checkout success | Polished checkmark badge (soft ring + shadow) + heavier title. Shown via the order-not-found state, which shares the badge; the live success screen adds a "Sale complete" eyebrow + order summary (#85) |
| 09 | `09-events.png` | Event setup | Booth-rule toggles, free-gift rule, and the stock allocator. NOTE: demo/config only — these do not drive POS checkout yet (#83) |

_Regenerate per `../README.md`._
