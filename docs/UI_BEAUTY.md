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

1. 🔄 **Branded loading skeletons** *(in progress — founder-chosen)* — new `ListSkeleton` (shimmer bars, screenshot-verified on customers) shipped on **customers / send-later / pre-orders**. Remaining loading states to convert (one+ per fire): `audit-log`, `correction`, `stock-count`, `close-day`, `setup/products` (CatalogManager), `inventory/samples`, `pos/success`.
2. Elevated dashboard hero ("Today's takings") — **present options first**.
3. Checkout-success delight (`/app/pos/success`) — **present options first**.
4. Illustrated empty states.

## Done
_(moved here per tick with the commit SHA)_
