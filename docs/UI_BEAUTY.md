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
