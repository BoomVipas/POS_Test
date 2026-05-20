---
name: mochipos-design
description: Use this skill to generate well-branded interfaces and assets for Mochi POS, a SaaS POS for booth sellers (multi-day inventory, Send Later, sample bucket, post-purchase customer/pet registration). Two layers: (1) Mochi POS SaaS — indigo/lavender/cream brand, dashboards, event setup, customer portal; (2) Meowmeow Event POS — cream/brown legacy reference for the booth-side cashier flow.
user-invocable: true
---

Read the README.md first — it covers the two-layer strategy (fast booth-side cashier flow vs post-purchase SaaS CRM) which drives every design decision.

For SaaS surfaces (dashboards, event setup, customer portal, onboarding, billing): use `colors_and_type.css` (indigo/lavender), reference `screens/*.html` for layout patterns, copy assets from `assets/` (mascot, wordmark, face).

For booth-side cashier surfaces: use `legacy/colors_and_type.css` (cream/brown), reference `legacy/ui_kits/pos_event/` and `legacy/ui_kits/receipt_admin/`.

If creating throwaway artifacts: copy assets out and produce static HTML.
If working on production code: copy assets, read the rules, become an expert.

If invoked without guidance, ask the user what they want to build, ask 4+ questions about audience/surface/scope, and act as an expert designer.

## Quick reference (SaaS)
- **Tokens:** `colors_and_type.css` — `--indigo` `#2d2960`, `--lavender` `#b8a9f0`, `--cream` `#f4eedf`, `--bg` `#f7f5fb`.
- **Wordmark:** use `assets/mochi-wordmark.png` for hero, `.wm` CSS class for inline ("Mochi" indigo + "POS" lavender).
- **Mascot:** `assets/mochi-mascot.png` (terminal+ghost) for hero use; `assets/mochi-face.png` for avatars.
- **Body type:** Nunito 400/600/700/800/900 (Google Fonts) — flag this as substitute for the custom logo face.
- **Money:** ฿ prefix, no decimals, `.num` class for tabular.
- **Shadows:** indigo-tinted, never warm-brown. Three tiers via `--shadow-rest` / `--shadow-card` / `--shadow-pop`.
- **Radii:** generous (12 / 16 / 20 / 28 / 36) — never sharp corners.
- **Three reference screens:** `screens/dashboard.html`, `screens/event-setup.html`, `screens/pet-portal.html`.

## Quick reference (Legacy / cashier)
- **Tokens:** `legacy/colors_and_type.css` — cream `--bg` `#f6f0e6`, brown `--accent` `#8d6236`.
- **Wordmark:** stacked Georgia "THE / Meow / SEUM" via `.wordmark` class — NOT a logo image.
- **Body type:** Aptos / Segoe UI / Tahoma.
- **Two reference UI kits:** `legacy/ui_kits/pos_event/` (iPad register), `legacy/ui_kits/receipt_admin/` (desktop sales browser).

## Strategy rule (non-negotiable)
**Customer registration is post-purchase, never in checkout.** The cashier flow must stay fast and low-typing. Pet profiles, allergies, contact info, loyalty — all happen on the customer portal (mobile, QR-linked from the receipt). Designs that block checkout with CRM forms will be rejected.

## Voice
SaaS: warm, founder-built, peer-to-peer with booth sellers. ("Sell fast at the booth. Save the data for later.")
Cashier (legacy): curatorial, warm, slightly bookish. Products are exhibits.
Customer portal: directly addresses the customer about their pet by name.
