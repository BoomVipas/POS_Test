# Cat Booth POS SaaS — Project Vision

## What it is

A web-based POS for cat-product booth sellers. Hosted on Vercel. Database, auth, and image storage on Supabase. Each client is a separate workspace with row-level isolation.

## Who it's for

The pilot targets exactly **5 cat-product brands** that:

- Sell at booths/events (pet expos, weekend markets, brand fairs)
- Have 10–100 SKUs
- Take cash + PromptPay/transfer + card
- Sometimes need send-later fulfillment for stock-out items
- Are willing to give weekly feedback during the pilot

Reject (or politely defer) for the pilot:

- Restaurants, coffee shops, food vendors
- Multi-branch retailers
- Brands with thousands of SKUs
- Customers who require an official Thai tax-invoice (e-tax) system on day one
- Customers who need a barcode scanner / receipt printer integration on day one

## Why it exists

`meowmeow_pos_event.html` proved the booth-POS workflow works. But it's:

- localStorage-only (data lives on one device, no backup, no audit trail across devices)
- Single-tenant (one brand, hard-coded)
- Single-file HTML (hard to extend safely)

The new product fixes all three by moving to a real database, multi-tenant workspaces, and a Next.js codebase.

## Hard requirements

1. Customer applies → we approve → we send invite code → customer registers → they land in their own workspace.
2. Before opening POS, the customer must set up product cards (SKU, price, image) — uploaded to Supabase Storage, indexed in Postgres.
3. Every sale, every payment record, every stock movement, every send-later order is persisted in Supabase. Nothing important lives in localStorage.
4. Workspace data isolation enforced by Supabase Row Level Security, not by application logic alone.
5. The POS UI must feel like meowmeow — same cream/brown palette, large product cards, sticky cart, payment-method buttons. Existing meowmeow customers should not feel disoriented.

## Non-goals (for the pilot)

- Subscription billing — pilot users are invited free.
- Mobile native apps — web only, mobile-responsive.
- Barcode scanning, receipt-printer integration, e-invoice integration.
- AI recommendations.
- Multi-currency.
- Multi-language beyond TH/EN toggle.
- Marketplace, customer-facing storefront, online ordering.

## Success criteria for the pilot

- 5 brands successfully completed registration via invite code.
- Each ran at least one full event day with ≥30 sales recorded.
- Zero data-isolation incidents (no client ever saw another client's data).
- End-of-day report exported and matches the cash drawer / transfer slip total within ±0 satang.
- Each pilot client agrees the system is safe to use for their next event.

## Important business rule

The pilot is **invitation-only by design**. The /apply form is the front door, but registration only opens once the admin approves and issues an invite code. This lets us:

- Manage support load.
- Stay focused on the cat-niche.
- Give each pilot client real attention.
- Reject non-fits gently (just don't approve them — no rejection letter required).

## Architectural principle: checkout first, profile later (added 2026-05-07)

**MochiPOS makes the cashier flow faster, not heavier.** Customer and pet profiles must not block checkout. At a busy expo booth, forcing staff to register every customer before completing a sale creates opportunity cost, longer queues, and lower adoption. If the seller loses 30–60 seconds per order, a 100-customer peak hour costs 75 staff-minutes — too expensive.

The system has two connected layers:

1. **POS App (seller-facing)** — used by cashier and staff during the event. Optimised for speed, low typing, mistake-resistance. Customer info entry is **optional** in this layer (Send Later orders need shipping info; take-now does not). Pet info is **never** entered here.
2. **Customer Portal (customer-facing)** — used by customers after purchase, accessed via QR on receipt or link by Line/SMS. Captures customer profile, pet profile (optional), connects to past orders, joins loyalty. Mobile-first, bilingual EN/TH.

The pet profile feature remains the **competitive moat** vs generic POS — but it is implemented as a **post-purchase relationship engine**, never as a checkout burden. See [Wave 40 (Customer Portal)](../TASKS.md) for the implementation plan and [VISION.md](../../VISION.md) at the repo root for the umbrella strategy.

### Cashier UX rules

- Required-to-save fields are limited to: product, qty, payment method, fulfillment (take-now / Send Later), discount.
- Customer fields are optional. Cashier sees one of: skip / phone-only / existing-customer-lookup / "send registration link after sale".
- Pet UI must not appear in the cashier checkout flow. It lives in the Customer Portal only.
- Receipt success screen offers a one-tap "Send registration link" action for any sale (walk-in cash, Send Later, etc).

### Customer Portal rules

- Reachable via QR on receipt or link by Line/SMS — never gated by login during the first registration.
- Order linking by token (one-shot, expires) so customers can claim "this was my order" without authentication.
- Pet profile is optional even within the portal — customer can register name + phone alone if they prefer.
- Consent for marketing is explicit and revocable.

## Pricing intent (post-pilot)

Out of scope for the 100-batch plan. The plan ends at "5 pilot clients running events successfully." Pricing model + Stripe wiring is its own future planning round.

## Glossary

- **Workspace**: one brand's isolated data tenant. `workspaces.id` ↔ `auth.users[N].id` via `workspace_members`.
- **Event**: one booth/fair (e.g., "Pet Expo 2026"). All sales happen within an event.
- **Order**: a customer transaction. Has 1+ order_items.
- **Order item fulfillment**: `take_now` (carried away) or `send_later` (we ship later).
- **Application**: a row in `applications` table — someone who filled the /apply form.
- **Invite code**: a one-shot signup token tied to one application.
- **Audit log**: append-only record of corrections, voids, refunds, stock adjustments.
