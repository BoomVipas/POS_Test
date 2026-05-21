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

1. **Elevation system** — *(in progress)* add a reusable shadow scale (`--shadow-rest`, `--shadow-lift`) cohesive with `--shadow-card`; apply to POS product cards with a premium hover; fix the 2 leftover **brown** shadows (`rgba(77,53,29…)` in `ProductCard`, `POSWorkspace`) → indigo.
2. **Hover / press micro-interactions** — consistent, tasteful transitions on cards, app-home tiles, and buttons (lift + shadow bloom on hover; subtle press). Respect `prefers-reduced-motion` (already handled globally).
3. **Type scale & rhythm** — audit heading/body sizes and vertical spacing for a consistent scale across screens; tighten where cramped, breathe where dense.
4. **Inputs & focus states** — unify input styling + focus ring across the bespoke inline inputs and the `ui/` components.
5. **App-home tiles** — give the launcher tiles depth + hover lift so they read as tappable; consider a subtle category accent.
6. **Card surfaces** — make list rows / panels share one elevation + radius rhythm.

## Phase 2 — signature moments (later)
- Checkout-success delight on `/app/pos/success/[orderId]`.
- Elevated dashboard hero (the "Today's takings" block).
- Branded loading skeletons (replace bare "Loading…").
- Illustrated/!iconographic empty states.

## Done
_(moved here per tick with the commit SHA)_
