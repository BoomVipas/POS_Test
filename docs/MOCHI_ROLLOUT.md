# Mochi POS — Design Rollout

Tracks the migration of `pos-for-sell` to the Mochi design system — one unified indigo/lavender brand across the whole app. See `.claude/skills/mochipos-design/SKILL.md` and `docs/DESIGN_TOKENS.md`.

## Done (PR #73)
- **Token foundation** — `globals.css` `:root` remapped to Mochi indigo/lavender; Nunito; cool indigo-tinted shadows; radii 16/20/28; `.btn-accent` / `.panel` tokenised so helpers follow the tokens.
- **Per-surface recolor** — all hard-coded brown/cream hex literals across ~24 component files converted to the indigo system. Categorical colors (Shopee orange, Lazada blue, ok-greens) preserved on purpose.
- **Verified** — `npm run build` (29 routes) + lint (0 errors) + typecheck green.
- **Accessibility (WCAG AA)** — contrast audit of the token palette: every real text pair passes ≥4.5:1 (text/bg 15.7 · muted/bg 5.1 · accent/bg 12.2 · status pairs 5.6–6.5 · white-on-indigo-button 10.1–14.0). The lavender highlight (`--color-gold` `#b8a9f0`) measures 2.1 on white, so keep it to backgrounds/accents only — it is not used as text anywhere today.

## Backlog (prioritized) — discretionary polish, best reviewed visually
Each loop fire takes the top unblocked item. Items marked 👁 want a visual eyeball.

1. **Brand identity** 👁 — add the Mochi wordmark (`.wm`: "Mochi" indigo + "POS" lavender) + mascot to the landing `/` hero and the app header (today it shows only the workspace name). Assets in the handoff `project/assets/`.
2. **Landing `/`** 👁 — match the handoff tone: hero, value prop ("Sell fast at the booth. Save the data for later."), apply CTA.
3. **Dashboard `/app/dashboard`** 👁 — align to `screens/dashboard.html`: 3–5 KPI cards, hourly chart, Send Later queue, low-stock. Also compose in the built-but-unwired tiles (Profit/Reorder/ActivityFeed/SourceSplit/multi-period) flagged in PRD F15.
4. **Event setup `/app/events*`** 👁 — `screens/event-setup.html`: stock allocator + sample bucket.
5. **Customer portal `/register/[token]`** 👁 — `screens/pet-portal.html`: mobile-first, pet chips (emoji), warm voice.
6. **Onboarding / apply / admin** — forms + tables to Mochi conventions (labels above fields, 4-state status chips, one primary CTA per view).
7. **POS till + receipt** 👁 — confirm the indigo reads well at booth speed (large touch targets, PAY prominence).

## Pending founder decisions (loop will NOT auto-decide)
- **CLAUDE.md rule #9** — still reads cream/brown; superseded by Mochi indigo. Update?
- **ok-greens** — plus-qty / "paid" greens are still the original green, not Mochi success `#1f7a4d`. Align or keep as distinct "positive" cue?

## Working rules
- Per-surface work goes on its own branch + PR; never to `main` directly; no self-merge.
- Keep `npm run build` + lint + typecheck green.
- Keep the post-purchase-CRM rule: no customer/pet capture in the checkout flow.
