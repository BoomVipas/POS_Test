# Mochi POS — Design System

A two-layer system serving the Mochi POS strategy:

1. **Mochi POS SaaS** *(this design system, root)* — the productized multi-tenant SaaS for booth sellers. Indigo + lavender + cream brand. Surfaces: seller dashboard, event setup, customer portal, onboarding, billing.
2. **Meowmeow Event POS** *(legacy/, heritage reference)* — the proven booth-side cashier app from theMeowseum's Pet Expo run. Cream + brown. Stays separate by design: the cashier flow is fast, low-typing, and never blocked by CRM. Pet/customer registration happens **after** purchase, on the SaaS portal — not in the cashier flow.

## Strategy in one line
> Sell fast at the booth. Build the customer relationship after the sale.

The cashier flow stays in the Meowmeow visual language (warm, calm, museum-curatorial). The SaaS layer (this system) is where stock setup, dashboards, customer profiles, and pet memory live — friendly, indigo, mascot-led.

## Sources
- **Logo:** `uploads/source-logo.png` — Mochi POS mascot + wordmark. Crops in `assets/`.
- **GitHub:** `visanchan/meowmeow_sandbox` — `meowmeow_pos_event.html`, `meowmeow_receipt_admin.html`. Used to derive the legacy Meowseum tokens; not the SaaS visual identity.
- **Strategy doc:** the May 7 2026 "Two-Project Bet" memo — informs why CRM is post-purchase, not in checkout.

## Index
- `colors_and_type.css` — SaaS tokens (CSS vars). Import this for any new SaaS surface.
- `assets/` — logo crops (mascot, wordmark, full lockup, face).
- `preview/` — design-system specimen cards (Brand, Colors, Type, Components, Spacing).
- `screens/` — three anchor SaaS screens:
  - `dashboard.html` — seller daily ops view (KPIs, hourly chart, Send Later queue, low stock)
  - `event-setup.html` — multi-day stock allocator with sample bucket + gift rules
  - `pet-portal.html` — mobile post-purchase customer/pet registration (QR landing)
- `legacy/` — Meowseum event POS reference (cream/brown tokens, full UI kit, receipt admin).
- `SKILL.md` — Claude Code-compatible skill manifest covering both layers.

## CONTENT FUNDAMENTALS (SaaS)
- **Voice:** warm, founder-built, slightly bookish. Confident without being corporate. We talk to booth sellers like peers — "Sell fast at the booth. Save the data for later." Never enterprise-speak.
- **Casing:** sentence case for UI ("Charge", "Send Later"). Title Case for product/event names. UPPER tracked .08em for eyebrows.
- **Pronoun:** second person ("Your booth", "Your pet"). The portal speaks directly to the customer about their pet by name ("So next time you visit, we'll know what Mochi loves").
- **Currency:** ฿ prefixed, no decimals on whole numbers, tabular numerics.
- **Emoji:** allowed in customer-facing portal (pet-type chips: 🐱 🐶 🐰), the receipt 🐾 glyph, and never in admin chrome. Never in dashboard or settings.
- **Examples:**
  - `"Today's takings"` (dashboard hero, not "Revenue")
  - `"Send Later queue · 12 orders · ship after Day 4"`
  - `"So next time you visit theMeowseum we'll know what Mochi loves"`
  - `"Takes 30 seconds · You can edit anytime"` (CTA support)

## VISUAL FOUNDATIONS (SaaS)
- **Palette.** Deep indigo `#2d2960` (primary), soft lavender `#b8a9f0` (accent — the "POS" half of the wordmark), warm cream `#f4eedf` (heritage tie to Meowseum), warm off-white page `#f7f5fb`. Semantic colors are muted, never neon.
- **Type.** **Nunito** 400/600/700/800/900 — geometric, friendly, rounded — chosen as the Google Fonts substitute closest to the logo's custom face. Display weights are 800–900 with `-.02em` to `-.025em` letter-spacing. Body 14–16px.
- **Backgrounds.** Page is a soft warm-cool wash (`#fbfaff → #f3eef9`). No imagery in chrome. Cream is reserved for receipt/order accents to nod to the Meowseum heritage.
- **Borders.** Hairline `1px #e5dff0`. Cards rarely have visible borders — they sit on shadow.
- **Shadows.** Three tiers, all cool indigo-tinted (never warm-brown like legacy). Rest = `0 1px 2px / 0 4px 12px`. Card = `0 4px 12px / 0 24px 48px`. Pop = `0 12px 24px / 0 32px 80px`.
- **Radii.** Generous: 12 / 16 / 20 / 28 / 36. Pills 999px. Mascot-roundness is the design ethos — no sharp corners.
- **Buttons.** Primary uses indigo gradient (`#3d3686 → #2a2557`). Accent is flat lavender. Secondary is white with indigo text and hairline border. Focus ring: `0 0 0 4px var(--lavender-200)`.
- **Animation.** Restrained 160ms ease on color/shadow/transform. Mascot can pulse-bounce on hero only; never inside admin tables.
- **Layout.** Desktop SaaS is 1280–1320px max-width centered. Customer portal is mobile-first 390px.

## ICONOGRAPHY
- **No bundled icon font.** SaaS screens use inline SVGs at the call site (search, scan, calendar, chevrons) at 18–22px stroke 1.75 — same drawing style as the legacy POS to keep the systems family-related.
- **Pet-type chips** in the portal use **emoji** intentionally — they read as warm and conversational on mobile, which is the right register for that surface. Never use emoji in dashboards or settings.
- **Substitution flag:** if a more elaborate icon is needed, link **Lucide** from CDN (`https://unpkg.com/lucide-static@latest/icons/<name>.svg`) — its 1.5–2 stroke matches.

## Caveats / open questions
- The wordmark in the logo is a **custom geometric-rounded face**. Nunito is the closest free webfont match; we ship it via Google Fonts and flag the substitution. Drop the real `.woff2` into `assets/fonts/` to unlock pixel parity.
- The Next.js rewrite under `meowmeow_sandbox/pos-for-sell/` is **not** mined yet — these tokens are pure derivation from the logo + strategy memo + booth POS heritage. If real source exists for the SaaS UI, we should cross-check.
- The **billing/onboarding** surfaces (request access, approval flow, registration code email, tenant setup) are described in the strategy memo but **not yet designed** — call them out when you want them.
