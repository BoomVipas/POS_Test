---
name: mochipos-design
description: Mochi POS design system for the MochiPOS (pos-for-sell) Next.js SaaS. One unified indigo/lavender brand (indigo #2d2960, lavender #b8a9f0, Nunito, cool indigo-tinted shadows, generous radii) applied across the WHOLE app — every SaaS surface and the booth cashier flow + receipt. Covers brand tokens, component patterns, voice, and the post-purchase-CRM rule. Use when building, restyling, reviewing, or rebranding any MochiPOS UI, applying Mochi brand/tokens, or when the user mentions the Mochi design system, the design handoff, or skinning the app.
user-invocable: true
---

# Mochi POS — Design System

One indigo/lavender brand across **all** of MochiPOS — this repo (Next.js 16 · React 19 · Tailwind v4).
Strategy in one line: **"Sell fast at the booth. Build the customer relationship after the sale."**

## The one rule (non-negotiable)
**Customer + pet registration is post-purchase, never in checkout.** The cashier flow stays fast and low-typing. Pet name / allergies / contacts / loyalty live on the QR-linked customer portal (F12) and the returning-customer lookup (F14) — never as a checkout form. Reject any design that blocks the till with a CRM form.

## One brand — indigo everywhere
Every surface uses the Mochi indigo/lavender palette: landing, apply, onboarding, admin, dashboard, events, setup, customers, settings, customer portal, **and** the booth cashier till (`/app/pos`) + printed receipt (`/app/pos/success`). The handoff's optional cream/brown "cashier layer" is **not** used here — cream/brown is heritage from the sibling MeowMeow Event POS (separate repo `visanchan/meowmeow_sandbox`) only.

## Tokens live in one file
The app is **token-driven**: `src/app/globals.css` defines `--color-*` / `--radius-*` / `--shadow-*` and exposes them to Tailwind v4 via `@theme inline`. Components consume the utilities (`bg-bg`, `text-accent`, `rounded-[var(--radius-xl)]`) and the `.panel` / `.btn-accent` helpers. **Re-skin = change the token VALUES in `:root`, not every component.**

> This supersedes CLAUDE.md hard rule #9 (cream/brown) — rule #9 should be updated to point here.

## Palette (indigo/lavender)
- **Brand:** `--color-accent #2d2960` (indigo primary), `--color-gold #b8a9f0` (lavender highlight = the "POS" half of the wordmark), `--color-accent-strong #1c1838` (emphasis / totals).
- **Surfaces:** page `#f7f5fb` (gradient `#fbfaff → #f3eef9`), panel `#ffffff`, soft `#efeaf6`, hairline `#e5dff0`. Text `#1c1838`, muted `#6b6489`.
- **Type:** Nunito 400/600/700/800/900 (loaded in `globals.css`). Display 800–900 at `-.02/-.025em`; body 14–16px. `.num` = tabular numerics.
- **Shadows:** cool indigo-tinted (`--shadow-card`), never warm-brown.
- **Radii:** generous 16 / 20 / 28; pills 999px. No sharp corners (mascot-roundness).
- **Buttons (`.btn-accent`):** indigo gradient `#3d3686 → #2a2557`, white text. Secondary: white + indigo text + hairline. Focus ring: 4px lavender.
- **Status:** ok `#195e3b` on `#d8efe2`, warn `#7c5614` on `#fcecc8`, danger `#8f2a22` on `#fbdcd8`.

## Money & voice
- **Money:** `฿` prefix, no decimals on whole numbers, tabular numerics everywhere.
- **Voice:** warm, founder-built, peer-to-peer ("Today's takings", not "Revenue"). Sentence-case UI, UPPER `.08em` eyebrows, second person. The portal addresses the customer about their pet by name.
- **Emoji:** only on the customer portal (🐱 🐶 🐰) + the receipt 🐾 glyph. Never in dashboards / admin / settings.

## Workflow (applying it)
1. Re-skin broadly by editing token VALUES in `globals.css` `:root`; components inherit.
2. Hunt down hard-coded hex literals in components (legacy brown like `#7e552a`, `#a9763f`, `#3a2509`) and replace with tokens (`var(--color-accent)`, etc.).
3. Ensure Nunito is loaded; match the closest reference screen for layout.
4. Keep the post-purchase rule. Run `npm run lint` + `npm run typecheck` (both green) before handing off.

## Reference (in repo — read for depth, don't duplicate)
- **Handoff:** `Mochi POS Design System-handoff/mochi-pos-design-system/`
  - Tokens: `project/colors_and_type.css`
  - Anchor screens: `project/screens/{dashboard,event-setup,pet-portal}.html`
  - Component specimens: `project/preview/*.html`
  - Assets: `project/assets/` (`mochi-wordmark.png`, `mochi-mascot.png`, `mochi-face.png`)
- **Current app:** `src/app/globals.css`, `docs/DESIGN_TOKENS.md`
