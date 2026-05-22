# Design Tokens — Mochi POS

`pos-for-sell` uses the **Mochi POS design system** — one unified indigo/lavender brand across the **whole** app (every SaaS surface and the booth cashier flow + receipt alike). See `.claude/skills/mochipos-design/SKILL.md`.

Tokens are CSS custom properties on `:root` in `src/app/globals.css`, exposed to Tailwind v4 via the `@theme inline` directive (so utilities like `bg-bg`, `text-accent` and the `.panel` / `.btn-accent` helpers all resolve from them). Re-skin the app by changing the values in `:root`.

> Heritage note: the cream/brown palette of `meowmeow_pos_event.html` (the sibling event-POS app) is **no longer used here** — pos-for-sell is fully Mochi indigo. This supersedes the old "match meowmeow" rule (CLAUDE.md hard rule #9).

## Palette

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#f7f5fb` | page base (warm-cool wash) |
| `--color-bg-grad-from` | `#fbfaff` | top of page gradient |
| `--color-bg-grad-to` | `#f3eef9` | bottom of page gradient |
| `--color-panel` | `#ffffff` | card / panel background |
| `--color-panel-strong` | `#faf8fd` | inner card / muted panel |
| `--color-line` | `#e5dff0` | borders, dividers |
| `--color-text` | `#1c1838` | primary text (near-black indigo) |
| `--color-muted` | `#6b6489` | secondary text |
| `--color-accent` | `#2d2960` | brand indigo |
| `--color-accent-strong` | `#1c1838` | hover, totals, emphasis |
| `--color-soft` | `#efeaf6` | inactive chip, soft tile |
| `--color-gold` | `#b8a9f0` | lavender highlight (the "POS" accent) |
| `--color-danger` | `#b8362d` | destructive, soldout |
| `--color-danger-soft-bg` | `#fbdcd8` | danger chip bg |
| `--color-danger-soft-fg` | `#8f2a22` | danger chip fg |
| `--color-warn-soft-bg` | `#fcecc8` | low-stock chip bg |
| `--color-warn-soft-fg` | `#7c5614` | low-stock chip fg |
| `--color-ok-soft-bg` | `#d8efe2` | paid/ok chip bg |
| `--color-ok-soft-fg` | `#195e3b` | paid/ok chip fg |

Primary button gradient: `linear-gradient(180deg, #3d3686 0%, #2a2557 100%)` with `color: #fffdf8` (tokens `--btn-grad-from` / `--btn-grad-to`). Shadows are cool indigo-tinted, never warm-brown.

## Radii

| Token | Value | Use |
|---|---|---|
| `--radius-md` | `16px` | buttons, small chips |
| `--radius-lg` | `20px` | inner panel, cart item |
| `--radius-xl` | `28px` | top-level panel, top bar |
| pill | `999px` | chip, pill, round button |

Generous radii (mascot-roundness) — no sharp corners.

## Shadow

Cool indigo-tinted elevation scale (never warm-brown). Use the `var(--shadow-*)` custom properties or the Tailwind `shadow-{card,rest,lift}` utilities.

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 4px 12px rgba(28,24,56,.06), 0 24px 48px rgba(28,24,56,.08)` | top-level panels (`.panel`) and the dashboard hero |
| `--shadow-rest` | `0 1px 2px rgba(28,24,56,.04), 0 8px 20px rgba(28,24,56,.06)` | resting state of interactive cards/tiles (product cards, app-home tiles, secondary KPI cards) |
| `--shadow-lift` | `0 4px 10px rgba(28,24,56,.07), 0 18px 36px rgba(28,24,56,.13)` | hover/lifted state of those cards, paired with `-translate-y-0.5` |

## Typography

- Body + display: **Nunito** 400/600/700/800/900 (Google Fonts, loaded in `globals.css`). Geometric, friendly, rounded — the closest free match to the logo's custom face.
- Display weights 800–900 with `-.02em` to `-.025em` letter-spacing.
- Numerics in totals: `font-variant-numeric: tabular-nums lining-nums` (the `.num` class).
- Codes / SKUs / order ids: monospace.

In Tailwind v4 we expose `font-sans` and `font-display` (both Nunito).

## Component patterns

- **Panel** (`.panel`): `border-radius: var(--radius-xl)`, near-white gradient background, hairline indigo border (~16% accent), cool card shadow.
- **Tab (active)**: indigo gradient background, off-white text, indigo shadow.
- **Pill (chip)**: 999px radius, soft tinted background, bold text.
- **Product card**: 16px radius, white surface, subtle shadow, hover `translateY(-1px)` + deepened shadow.
- **Sticky cart**: large radius, near-white with `backdrop-filter: blur`, fixed top-right on desktop.
- **Quantity buttons**: minus = danger tint, plus = ok tint.

## Light-mode only

Booth lighting is unreliable. No dark mode — `globals.css` defines no `prefers-color-scheme: dark` block.

## Mobile / iPad

- Product grid: 2 columns at `<640px`, 3 at `≥640px`, 4 at `≥1024px`.
- Sticky cart: bottom drawer at `<1024px`, right column at `≥1024px`.
- Touch targets: minimum 36px tall, ideally 44px.

## Print (receipt)

`globals.css` defines a `@media print` block used by `/app/pos/success/[orderId]`:

- `html, body` → white background, black text.
- `header`, `nav`, `.no-print` → `display: none`.
- `.panel` → flattens (no border, shadow, radius, padding).
- `main` → capped at `80mm` (thermal-receipt width), centered.
- Tabular numerics preserved.
