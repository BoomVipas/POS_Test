# Design Tokens — Mochi POS (indigo brand)

The SaaS web app uses the **Mochi POS indigo** brand. Tokens here are the canonical source of truth and are mirrored from the parent design system (`/colors_and_type.css` and `/handoff/globals.css`). The booth-side cashier app (`meowmeow_pos_event.html`) keeps its **legacy cream/brown** palette — see `legacy/` in the design system for that reference.

Tokens below are reflected in `src/app/globals.css` via Tailwind CSS v4's `@theme inline` directive.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#f7f5fb` | page base |
| `--color-bg-grad-from` | `#faf8fd` | top of page gradient |
| `--color-bg-grad-to` | `#efeaf6` | bottom of page gradient |
| `--color-panel` | `#ffffff` | card / panel background |
| `--color-panel-strong` | `#ffffff` | inner card highlight |
| `--color-soft` | `#efeaf6` | inactive chip, soft tile |
| `--color-line` | `#e5dff0` | borders, dividers |
| `--color-text` | `#1c1838` | primary text (indigo-near-black) |
| `--color-muted` | `#6b6489` | secondary text |
| `--color-accent` | `#2d2960` | brand indigo |
| `--color-accent-strong` | `#3a3478` | hover, totals, emphasis |
| `--color-gold` | `#b8a9f0` | lavender highlight pill |
| `--color-danger` | `#b8362d` | destructive, soldout |
| `--color-danger-soft-bg` | `#fbdcd8` | soldout/danger chip bg |
| `--color-danger-soft-fg` | `#8b2820` | soldout/danger chip fg |
| `--color-warn-soft-bg` | `#fcecc8` | low-stock chip bg |
| `--color-warn-soft-fg` | `#a8761c` | low-stock chip fg |
| `--color-ok-soft-bg` | `#d8efe2` | paid/ok chip bg |
| `--color-ok-soft-fg` | `#1f7a4d` | paid/ok chip fg |

Primary button gradient: `linear-gradient(180deg, #3d3686 0%, #2a2557 100%)` with `color: #ffffff`.

Brand wordmark: "Mochi" in `--color-accent` (`#2d2960`), "POS" in lavender (`#7a6ad6`).

## Radii

| Token | Value | Use |
|---|---|---|
| `--radius-md` | `14px` | buttons, small chips |
| `--radius-lg` | `20px` | inner panel, cart item |
| `--radius-xl` | `28px` | top-level panel, top bar |
| pill | `999px` | chip, pill, round button |

## Shadow

`--shadow-card: 0 4px 12px rgba(28,24,56,0.06), 0 24px 48px rgba(28,24,56,0.08)` — applied to top-level panels.

## Typography

- Body: `"Nunito", "Inter", ui-sans-serif, system-ui, sans-serif`
- Display headings: `"Nunito", ui-sans-serif, system-ui, sans-serif` — weight 800–900, letter-spacing `-0.025em`
- Numerics in totals: `font-variant-numeric: tabular-nums lining-nums`, `letter-spacing: -0.02em`

> **Note:** Nunito is a near-match substitute for the rounded MochiPOS logo wordmark. When the custom logo face is licensed, swap it via `--font-display` only — keep Nunito as the body face.

In Tailwind v4 we expose:

- `font-sans` → Nunito stack (default)
- `font-display` → Nunito stack (heavy weights for hero copy)

## Component patterns

- **Panel**: `border-radius: var(--radius-xl)`, solid white background, 1px border `var(--color-line)`, card shadow.
- **Tab (active)**: indigo gradient background, white text, soft indigo shadow.
- **Pill (chip)**: 999px radius, soft tinted background, bold text.
- **Product card**: 16px radius, white background, subtle shadow, hover `translateY(-1px)` + deepened shadow.
- **Sticky cart**: 30px radius, `rgba(255,255,255,0.98)` with `backdrop-filter: blur(14px)`, fixed top-right on desktop.
- **Quantity buttons**: minus = soft red/danger, plus = soft green/ok.

## Light-mode only

The booth lighting is unreliable. We do not implement dark mode. Override the create-next-app default `prefers-color-scheme: dark` block in `globals.css`.

## Mobile/iPad

- Product grid: 2 columns at `<640px`, 3 columns at `≥640px`, 4 columns at `≥1024px`.
- Sticky cart: bottom drawer at `<1024px`, right column at `≥1024px`.
- Touch targets: minimum 36px tall, ideally 44px.

## Migration note (May 2026)

This file replaced the previous cream/brown token set carried over from `meowmeow_pos_event.html`. The booth-side single-file POS still uses the legacy palette — if you ever render the legacy POS inside this Next.js app, scope its CSS with a `.legacy-booth` wrapper rather than mixing the palettes globally.
