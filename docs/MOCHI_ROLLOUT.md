# Mochi POS — Design Rollout

Tracks the migration of `pos-for-sell` to the Mochi design system — one unified indigo/lavender brand across the whole app. See `.claude/skills/mochipos-design/SKILL.md` and `docs/DESIGN_TOKENS.md`.

## Done (PR #73)
- **Token foundation** — `globals.css` `:root` remapped to Mochi indigo/lavender; Nunito; cool indigo-tinted shadows; radii 16/20/28; `.btn-accent` / `.panel` tokenised so helpers follow the tokens.
- **Per-surface recolor** — all hard-coded brown/cream hex literals across ~24 component files converted to the indigo system. Categorical colors (Shopee orange, Lazada blue, ok-greens) preserved on purpose.
- **Verified** — `npm run build` (29 routes) + lint (0 errors) + typecheck green.
- **Accessibility (WCAG AA)** — contrast audit of the token palette: every real text pair passes ≥4.5:1 (text/bg 15.7 · muted/bg 5.1 · accent/bg 12.2 · status pairs 5.6–6.5 · white-on-indigo-button 10.1–14.0). The lavender highlight (`--color-gold` `#b8a9f0`) measures 2.1 on white, so keep it to backgrounds/accents only — it is not used as text anywhere today.

## Shipped since PR #73 (reconciled 2026-05-22)
The original per-surface backlog is largely done — verified against merged PRs + live code:
- **Brand identity** ✅ — Mochi mascot + wordmark live in the app header (`app/layout.tsx`), plus onboarding / apply / register / learn.
- **Landing `/`**, **Dashboard** (#76), **Customer portal `/register/[token]`** (#77), **`/apply`** (#78), **Onboarding wizard** (#79) — all redesigned to their mockups. ✅
- **Event setup `/app/events`** — MVP + booth-rules/free-gift config rail in flight on `pos/mochi-events` (PR #83).
- **Empty states** — audited 2026-05-22: products uses the shared `EmptyState`; send-later / pre-orders / correction / audit-log are ad-hoc but already carry body + CTA; `CustomersList` CTA added this pass. Every list empty now has a next action.

## Visual audit (2026-05-22)
Ran a Playwright full-page screenshot pass over the main demo screens and eyeballed each. **The system is visually pilot-ready** — Mochi indigo is consistent across surfaces, empty states carry CTAs, the dashboard is rich and composed, and the new `ConfirmDialog` renders correctly (named title, red destructive button). Findings:

- ✅ **Fixed this pass:** POS product cards rendered the product name twice (image-area fallback **and** below the tile). Image-less cards now show a 2-letter monogram (`ProductCard.tsx`).
- **Landing `/`** — no Mochi wordmark/mark at top-left (only the language toggle). The hero is the brand moment so it's minor; a small top-left mark would reinforce it. *(low priority)*
- **App-home tiles** — text-only, no icons. Fine for low training burden; icons would add scannability. *(optional)*
- **Admin tables (👁)** — render "Admin offline" in demo mode (Supabase-gated). Cannot be visually audited without creds; parked until a Supabase project exists.
- Confirmed good: landing, app home, POS, products, dashboard, send-later, settings + ConfirmDialog, customers (empty-state CTAs working).

Audit recipe (reproducible): a temporary Playwright spec navigating the demo routes with `page.screenshot({ fullPage: true })`, run via `npx playwright test`; deleted after each pass so it never runs in CI.

## Backlog (prioritized) — cross-cutting UX polish
Each loop fire takes the top unblocked item. Items marked 👁 want a visual eyeball.

1. **Native `confirm()` → `ConfirmDialog`** — replace bare browser dialogs (unstyled, off-brand, can't name the object or color the destructive button) with `components/ui/ConfirmDialog` (named title, styled, red destructive button, Esc/backdrop = cancel). **Done:** `settings/DangerZone.tsx` (reset all), `setup/products/CatalogManager.tsx` (delete product), `stock-count/StockCountManager.tsx` (discard count session), `send-later/SendLaterList.tsx` (cancel fulfillment), `pre-orders/PreOrderList.tsx` (cancel pre-order). Remaining destructive site:
   - `pos/PetCardsBlock.tsx` (remove pet — note: Wave-35 block, may be refactored out by the portal work) — **last one in the queue**

   Non-destructive `confirm()`s (lower priority): `pos/ImportClaimButton.tsx` (replace cart); `CatalogManager` "add samples on top" (also currently unreachable — only fires when the catalog is non-empty, but that handler is only called from the empty state).
2. **Empty-state consistency** — optionally route the ad-hoc list empties (send-later, pre-orders, correction, audit-log) through the shared `EmptyState` component. Cosmetic only; they already function.
3. **Admin tables** 👁 — `/admin/*` lists to Mochi table conventions (sticky header, right-aligned numerics, consistent 4-state status chips) where not yet applied.
4. **POS till + receipt** 👁 — confirm the indigo reads at booth speed (large touch targets, PAY prominence).

## Pending founder decisions (loop will NOT auto-decide)
- **CLAUDE.md rule #9** — still reads cream/brown; superseded by Mochi indigo. Update?
- **ok-greens** — plus-qty / "paid" greens are still the original green, not Mochi success `#1f7a4d`. Align or keep as distinct "positive" cue?

## Working rules
- **UX-polish loop** (`/loop`, every 10 min): cross-cutting polish — the `confirm()` migration (item 1) and empty-state consistency (item 2) — accumulates on branch `pos/ux-polish` (**PR #84**). Append commits there; don't open a new branch per tick. Per-surface redesigns still get their own branch.
- Per-surface work goes on its own branch + PR; never to `main` directly; no self-merge.
- Keep `npm run build` + lint + typecheck green.
- Keep the post-purchase-CRM rule: no customer/pet capture in the checkout flow.
