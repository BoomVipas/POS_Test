# UI Beauty — visual-refinement loop

Tracks the "make the UI more beautiful" loop (founder request, 2026-05-22). Mochi theme is locked; this is **execution quality within Mochi**, not a new direction. Driven by the `ux-ui-design` skill.

## Working rules
- Branch `pos/ui-beauty` (PR TBD). Append commits here; don't fragment per tick.
- **Screenshot before/after every visual change** (Playwright spec → `.audit-shots/`, deleted after). Beauty can't be judged from code.
- Keep `npm run build` + lint + typecheck + 332 tests green.
- Stay within Mochi tokens (indigo/lavender). No new brand direction without founder sign-off.
- One bounded refinement per tick.

## Phase 1 — broad refinement (current)
A pervasive quality lift across screens. Each loop fire takes the top open item.

1. ✅ **Elevation system** — `--shadow-rest` / `--shadow-lift` scale added (cohesive with `--shadow-card`); POS product cards rest→lift on hover; 2 leftover **brown** shadows fixed. *(pass 1)*
2. ✅ **Hover / press micro-interactions** — app-home tiles lift + accent border + shadow-bloom on hover, settle on press; every `Button` gets a subtle `active:translate-y-px` press. Product cards already lift (pass 1); list rows already have subtle hover. *(pass 2)*
3. ✅ **Type scale & rhythm** — page titles were rendering at Nunito 400 (no weight class) and inconsistent (only the dashboard had weight/tracking). Standardized all 11 `/app` page titles to `font-extrabold tracking-tight` — heavier, tighter, more intentional + consistent. *(pass 3)*
4. ✅ **Inputs & focus states** — shared `ui/` inputs were already unified; the bespoke money/number-entry inputs (close-day counted-cash, import-claim code, cash tender, cart qty, split-payment, correction qty, stock-count qty) lacked the focus ring and send-later tracking had no focus at all. All now use `focus:ring-2 focus:ring-accent/25` consistently. *(pass 4)* Pet-form fields + customer-info tag chip ringed too. *(pass 5)*
5. ✅ **App-home tiles** — depth + hover lift added *(pass 2)*.
6. ✅ **Card surfaces** — reviewed: list rows already share radius + border + `bg-panel`; deliberately flat (elevation reserved for cards / tiles / panels), so no change needed.

**→ Broad refinement complete (passes 1–5).** Remaining work is Phase 2 (signature moments) — more opinionated/subjective; recommend a founder review of PR #85 before proceeding.

## Phase 2 — signature moments
Founder direction (2026-05-22): **start with branded loading skeletons** (least subjective). The opinionated ones below need options presented first.

1. ✅ **Branded loading skeletons (DONE)** — `ListSkeleton` (shimmer bars) on every list screen (customers, send-later, pre-orders, audit-log, correction, stock-count, close-day, setup/products, inventory/samples) + a single `Skeleton` block on `pos/success`. Bare "Loading…" text is gone app-wide. *(passes 6–8)*
2. ✅ **Dashboard hero** — full-width indigo gradient revenue card (big ฿figure + delta + a subtle white `Sparkline` trend) above a clean 3-metric strip (orders / margin / avg bill). Founder chose the "hero card" direction. Conservative, pilot-ready; no workflow change. *(pass 9)*
3. ✅ **Checkout-success delight** — polished checkmark badge (larger, soft ring + shadow, gentle `success-pop` entrance that respects `prefers-reduced-motion`), a "Sale complete" eyebrow, and the heavier title treatment. Conservative. Verified via the not-found state (shares the badge); the full success screen uses the same header + order summary. *(pass 10)*
4. ✅ **Illustrated empty states** — `EmptyState` gained an optional `icon` (soft lavender circle); every list empty now carries a tasteful icon: products 🏷️, customers 🐾, send-later 📦, pre-orders ⏳, correction 🧾, audit-log 📋. *(pass 11)*

## ✅ Beauty loop complete (2026-05-22)
All queued work shipped on `pos/ui-beauty` (PR #85) across passes 1–11: elevation scale, hover/press micro-interactions, premium page titles, unified input focus, card-surface review, branded loading skeletons, dashboard gradient hero + sparkline, checkout-success delight, illustrated empty states. The recurring loop was stopped on completion. Ready for the founder's one-time review of PR #85.

## Done
_(moved here per tick with the commit SHA)_
