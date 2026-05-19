# Design Tokens (carried over from meowmeow)

The look-and-feel must match `meowmeow_pos_event.html`. Tokens below are extracted from its `:root` and translated for Tailwind CSS v4's `@theme` directive (see `src/app/globals.css`).

## Palette

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#f6f0e6` | page base |
| `--color-bg-grad-from` | `#fbf7ef` | top of page gradient |
| `--color-bg-grad-to` | `#f1e7d6` | bottom of page gradient |
| `--color-panel` | `#fffaf3` | card / panel background |
| `--color-panel-strong` | `#fffdf9` | inner card highlight |
| `--color-line` | `#ddcfbe` | borders, dividers |
| `--color-text` | `#2b231d` | primary text |
| `--color-muted` | `#736555` | secondary text |
| `--color-accent` | `#8d6236` | brand brown |
| `--color-accent-strong` | `#6e4b27` | hover, totals, emphasis |
| `--color-soft` | `#efe5d6` | inactive chip, soft tile |
| `--color-gold` | `#c59a54` | highlight pill |
| `--color-danger` | `#b44b3f` | destructive, soldout |
| `--color-danger-soft-bg` | `#f8e1de` | soldout/danger chip bg |
| `--color-danger-soft-fg` | `#8b3d34` | soldout/danger chip fg |
| `--color-warn-soft-bg` | `#fff2dd` | low-stock chip bg |
| `--color-warn-soft-fg` | `#9a641d` | low-stock chip fg |
| `--color-ok-soft-bg` | `#e4f0dc` | paid/ok chip bg |
| `--color-ok-soft-fg` | `#3f6d34` | paid/ok chip fg |

Active button gradient: `linear-gradient(180deg, #a9763f 0%, #7e552a 100%)` with `color: #fffdf8`.

## Radii

| Token | Value | Use |
|---|---|---|
| `--radius-md` | `14px` | buttons, small chips |
| `--radius-lg` | `20px` | inner panel, cart item |
| `--radius-xl` | `28px` | top-level panel, top bar |
| pill | `999px` | chip, pill, round button |

## Shadow

`--shadow-card: 0 22px 52px rgba(77,53,29,0.10)` — applied to top-level panels.

## Typography

- Body: `"Aptos", "Segoe UI", Tahoma, sans-serif`
- Display headings (h1 brand): `Georgia, "Times New Roman", serif`, font-weight 700, letter-spacing `-0.045em`, line-height `0.88`
- Numerics in totals: `font-variant-numeric: tabular-nums lining-nums`

In Tailwind v4 we expose:

- `font-sans` → Aptos stack
- `font-display` → Georgia stack

## Component patterns

- **Panel**: `border-radius: var(--radius-xl)`, gradient background `linear-gradient(180deg, #fffdf9 0%, #fcf5e9 100%)`, 1px border at `rgba(141,98,54,0.14)`, card shadow.
- **Tab (active)**: gradient brown background, off-white text, soft brown shadow.
- **Pill (chip)**: 999px radius, soft tinted background, bold text.
- **Product card**: 16px radius, cream gradient, subtle shadow, hover `translateY(-1px)` + deepened shadow.
- **Sticky cart**: 30px radius, `rgba(255,251,246,0.98)` with `backdrop-filter: blur(14px)`, fixed top-right on desktop.
- **Quantity buttons**: minus = pink/danger, plus = green/ok.

## Light-mode only

The booth lighting is unreliable. We do not implement dark mode. `globals.css` defines no `prefers-color-scheme: dark` block — the create-next-app default was removed when the meowmeow palette was wired in.

## Mobile/iPad

- Product grid: 2 columns at `<640px`, 3 columns at `≥640px`, 4 columns at `≥1024px`.
- Sticky cart: bottom drawer at `<1024px`, right column at `≥1024px`.
- Touch targets: minimum 36px tall, ideally 44px.

## Print (receipt)

`globals.css` defines a `@media print` block used by `/app/pos/success/[orderId]` and any future printable view:

- `html, body` → white background, black text.
- `header`, `nav`, `.no-print` → `display: none`. Add `.no-print` to anything (banners, controls) that must not appear on paper.
- `.panel` → flattens (no border, no shadow, no radius, no padding) so it prints as plain text rather than a card.
- `main` → capped at `80mm` (thermal-receipt width) and centered.
- Tabular numerics preserved.

If you add a new printable surface, prefer reusing `.panel` and tagging non-receipt UI with `.no-print` rather than introducing more print-specific rules.
