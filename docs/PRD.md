# MochiPOS — Product Requirements Document

> **Scope:** MochiPOS **v0.1 Pilot** — invite-only SaaS POS for 5 cat/pet-product booth sellers running one real event each.
> **Strategy context lives elsewhere** — this PRD is feature-level, structured as module entries with the founder's required format:
> **Flow · Description · Purpose · Consumer · Expected output**.
>
> Read alongside: [ROADMAP.md](ROADMAP.md) (canonical strategy) · [PROJECT_VISION.md](PROJECT_VISION.md) (pilot mechanics) · [USER_FLOW.md](USER_FLOW.md) (flow diagrams) · [ARCHITECTURE.md](ARCHITECTURE.md) (tech) · [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) (data) · [STATUS.md](STATUS.md) (ship state).

---

## At a glance

| Field | Value |
|---|---|
| Product | MochiPOS — SaaS POS for pet/cat booth sellers |
| Release | v0.1 Pilot |
| Beachhead | Pet Expo Thailand sellers (cat-product booths first) |
| Pilot size | 5 selected brands, 1 real event each |
| Stack | Next.js 16 · React 19 · TS 5 · Tailwind 4 · Supabase · Resend · Vercel · npm |
| Core principle | Fast checkout first, customer relationship later |
| Tenant model | One Supabase project, RLS-isolated workspaces |
| Money model | THB satang (`bigint`), no floats |
| Languages | EN / TH |

---

## Consumers (personas, referenced below by ID)

| ID | Persona | Notes |
|---|---|---|
| **P1** | Brand owner / founder-operator | Owns the booth, 10–100 SKUs, picks tools, signs up |
| **P2** | Cashier / booth staff | Works the till, speed-critical |
| **P3** | Booth customer (walk-up or returning) | Mobile-first, post-sale registration |
| **P4** | Platform admin (founder of MochiPOS) | Approves pilot sellers, monitors usage, supports |

---

## Module index

| # | Module | Status (2026-05) |
|---|---|---|
| F01 | Public application (Apply to pilot) | Wired |
| F02 | Admin approval + invite code issuance | Wired |
| F03 | Seller authentication (Google + invite code) | Blocked on Supabase |
| F04 | Workspace + business onboarding | Placeholder |
| F05 | Product / SKU setup | Demo + UI partial |
| F06 | Event setup | Planned |
| F07 | Event stock allocation (warehouse → event / sample / gift buckets) | Wave 39a data layer done |
| F08 | POS fast checkout | Demo full UX, RPC pending |
| F09 | Send Later fulfillment | Demo persisted |
| F10 | Bill void / line correction / partial refund | Demo + RPCs SQL ready |
| F11 | Receipt + PromptPay QR | Live (mock data) |
| F12 | Customer Portal QR registration | Wave 40b demo done, Wave 40d pending |
| F13 | Customer + pet profile (post-purchase) | Wave 40a data layer done |
| F14 | Returning customer lookup | Wave 40c done |
| F15 | Daily + multi-period dashboard | Wave 34 done (mock) |
| F16 | End-of-event CSV export + archive | CSV lib done; flow pending |
| F17 | Admin operations (apps, codes, workspaces, audit, pilot board) | Mostly wired |

---

# Modules

---

## F01 — Public application (Apply to pilot)

**Description.** Public marketing page + `/apply` form that lets a prospective seller submit their brand details so the admin can review them.

**Purpose.** The front door of the invite-only pilot. We want enough info to decide fit (cat/pet booth, SKU count, events per year, payment methods) without scaring off a real applicant with a long form.

**Consumer.** P1 (prospective brand owner). Also P4 reads the resulting rows.

**Flow.**
```
Visitor lands on /
↓
Clicks "Apply to join the pilot" → /apply
↓
Fills: owner name, phone, email, brand name, IG/FB, # SKUs, events/year, current POS method, why us
↓
Submits → Server Action inserts into `applications` table
↓
Sees /apply/success ("we'll email you within 3 working days")
↓
(Optional) /apply/status lets them check status by email
↓
Admin gets a "New application from <brand>" email via Resend
```

**Expected output.**
- One row in `applications` with `status = new`.
- One new-application email delivered to admin.
- Visitor sees success page; can re-check via /apply/status.
- Anti-spam rate limit holds under repeat submissions.

---

## F02 — Admin approval + invite code issuance

**Description.** Admin-only screens to triage applications and issue single-use invite codes by email.

**Purpose.** Keep the pilot invite-only by design. Approve only sellers we can support; reject (or waitlist) the rest without sending a rejection letter. Generate a code that ties one seller to one workspace.

**Consumer.** P4 (admin).

**Flow.**
```
Admin logs in at /login (Supabase Auth)
↓
Lands on /admin (gated by `admin_users`)
↓
/admin/applications → list, filter by status
↓
Clicks an application → review details
↓
Approve → Server Action: applications.status = approved,
                         insert `invite_codes` row (16-char, ambiguity-safe).
                         **Admin sends the code manually (Gmail / Line / DM) during pilot.**
                         (Automated Resend invite email is post-pilot.)
   or
Reject → applications.status = rejected (no email)
↓
/admin/invite-codes → see issued codes (read-only in pilot — no resend, no cancel).
                      If a code goes wrong, admin re-approves to generate a fresh code.
↓
/admin/workspaces → see all workspaces + last-activity
↓
/admin/audit-log → admin actions appear here
```

**Expected output.**
- Approval emits a working invite code (16-char, ambiguity-safe).
- Admin delivers the code manually during pilot; automated Resend email is post-pilot.
- `audit_logs` row written for every approve / reject action.
- Admin can see which codes are used vs. outstanding (read-only list during pilot).

---

## F03 — Seller authentication (Google + invite code)

**Description.** Login uses Supabase Auth with Google provider. The invite code binds a Google identity to one workspace.

**Purpose.** Google Auth answers "who is this user?" only. MochiPOS still controls "which business do they belong to?" and "are they approved?" — so we don't open public signup during pilot.

**Consumer.** P1 (seller signing up); P2 (staff member invited later).

**Flow.**
```
Approved seller receives invite email with code
↓
Visits /register, enters code
↓
Code validated server-side → fetches applicant email + brand
↓
Clicks "Continue with Google" → Supabase Auth verifies
↓
Server checks email matches the invite + code is unused/unexpired
↓
If valid → activate seller account, mark `invite_codes.status = used`
↓
Create workspace row + first `workspace_members` row (role = owner)
↓
Redirect to /onboarding (business profile + consents)
↓
Then to /app/setup/products
```

**Expected output.**
- Working Google Auth login.
- One workspace per approved seller.
- Invite code can be used exactly once.
- Owner row in `workspace_members` with role `owner`, status `active`.
- Required consents stored (ToS + Privacy Notice).

---

## F04 — Workspace + business onboarding

**Description.** First-run setup wizard. Collects business profile fields, sets `setup_complete` once products + first event are configured.

**Purpose.** Make sure every workspace has the data the rest of the system depends on: brand name, category, payment methods accepted, currency (THB), Thai timezone, optional contact info.

**Consumer.** P1 (owner) on first login. Staff (P2) skip this — they land in `/app` directly.

**Flow.**
```
Post-signup → /onboarding
↓
Step 1: business profile (brand, category, sales channel, events/year)
↓
Step 2: required consents (ToS + Privacy Notice)
        optional consents (marketing emails, anonymized benchmark)
↓
Step 3: invite staff (optional — Resend invite emails)
↓
Submit → workspaces row updated, members invited
↓
Redirect to /app/setup/products
↓
After first product + first event → `workspaces.setup_complete = true`
```

**Expected output.**
- Workspace row populated with business profile fields.
- Consents recorded with timestamp.
- Optional: staff invites sent with their own invite codes.
- Setup-complete flag flips once first product + first event exist.

---

## F05 — Product / SKU setup

**Description.** CRUD for products + SKUs + categories + images. Image upload uses client-side WebP compression before Supabase Storage.

**Purpose.** Sellers cannot run a booth without a product catalog. Image quality + price/cost accuracy are the foundation of every later number (gross margin, CSV export, dashboard).

**Consumer.** P1 (owner). Sometimes P2 (admin staff role) for edits.

**Flow.**
```
/app/setup/products → empty state on first run
↓
"+ Add product" → modal opens
↓
Fill: SKU, name, category, subcategory, price, cost, image, allow-Send-Later flag
↓
Image picked → client-side WebP compress → upload to Supabase Storage
↓
Submit → insert into `products` (+ `product_images`)
↓
Repeat per SKU, edit/delete inline, search by SKU/name
↓
"I'm done" → continue to event setup
```

**Expected output.**
- One `products` row per SKU with valid SKU code (validated + normalized).
- Compressed WebP image in Storage with public URL.
- Allow-Send-Later flag controls whether the SKU can be sold as Send Later in POS.
- Price/cost stored as satang `bigint` (no floats).

---

## F06 — Event setup

**Description.** Create an event (booth at a fair). One workspace can have many events over time; sales always happen within an event context.

**Purpose.** Multi-day pet expos and weekend markets are the real selling unit, not individual days. Tracking by event lets us aggregate Day 1 + Day 2 + Day 3 cleanly and compare across events.

**Consumer.** P1 (owner).

**Flow.**
```
/app/events/new
↓
Fill: event name, venue, start_date, end_date, event_type (expo / market / fair),
      booth size, expected foot traffic
↓
Submit → insert into `events`, status = upcoming
↓
On the event day → /app/events/<id>/start
↓
Allocate stock (see F07)
↓
Status → in-progress, opens /app/pos
↓
At close → /app/events/<id>/close (day-N close)
↓
After last day → /app/events/<id>/close-event (final close, archive)
```

**Expected output.**
- `events` row with workspace_id and dates.
- Event drives the URL space: `/app/events/<id>/{pos,stock,dashboard}`.
- Status lifecycle: upcoming → in-progress → closed_day_N → archived.

---

## F07 — Event stock allocation (warehouse → event / sample / gift buckets)

**Description.** Move stock from warehouse into the event. Within an event there are sub-buckets: sellable, sample, free-gift. Every move writes an `inventory_movements` row.

**Purpose.** The biggest cause of post-event drift is sample / free-gift / Send Later movement that isn't tracked. Making each bucket a first-class quantity (not a flag on the sellable count) is the fix — it's the meowmeow field finding ported into SaaS.

**Consumer.** P1 (owner) on setup. P2 (cashier or admin staff) during the event when converting buckets.

**Flow.**
```
/app/events/<id>/stock → see warehouse_stock and event_inventory side by side
↓
For each SKU → "Allocate" → enter qty
↓
Server Action → decrement warehouse_stock, insert/update event_inventory,
                write `inventory_movements` row (type = `stock_in`)
↓
During event:
  → "Make sample" → convert_event_to_sample(qty)
  → "Return to event" → convert_sample_to_event(qty)
  → "Give as gift" → bucket → given (recorded as `gift_given`)
  → POS sale → `event_inventory.sellable_qty` decrement (atomic in create_order)
↓
Stock-count session (Wave 33) → reconcile, write `correction` movement
```

**Expected output.**
- `event_inventory` row per (event, product) with `sellable_qty` + `sample_qty` (Wave 39a model).
- `inventory_movements` ledger: every change is one row with type + reason + staff_id.
- End-of-event totals are computable: `closing = opening − sold − sample_sold − gift_given − send_later_reserved ± corrections`.

---

## F08 — POS fast checkout (the speed-critical layer)

**Description.** The product-grid + cart + payment screen. The reason MochiPOS exists. Visual + ergonomic parity with `meowmeow_pos_event.html`. Discount presets are **per-workspace configurable** (default 20 / 50 / 100 THB) so each booth's UI matches their typical promotions.

**Purpose.** A booth queue at peak hour cannot tolerate slow checkout. Every UI decision in this module is judged by "does it cost cashier seconds?" Customer registration, pet info, loyalty — none of those happen here. They happen on the receipt screen (F11) and the customer portal (F12).

**Consumer.** P2 (cashier) primary. P1 sometimes covers the till.

**Flow.**
```
/app/events/<id>/pos → product grid (left), sticky cart panel (right, 440px)
↓
Tap product → ADD to cart
↓
Adjust qty +/- per line, remove with X
↓
(Optional) per-line note (Wave 21)
↓
Apply discount: workspace-configured presets (default 20 / 50 / 100 THB) or custom amount
↓
Pick payment method: cash / PromptPay / transfer / card / other
   (or split — cash + PromptPay + card on one bill, Wave 22)
↓
(Optional) quick-cash tender → auto change calc (Wave 21)
↓
Confirm → ReviewModal → "Pay & confirm"
↓
Server Action → `create_order` RPC (atomic):
                  - insert orders
                  - insert order_items
                  - insert payment_records (1..N for split)
                  - insert send_later_orders (if any line is Send Later)
                  - decrement event_inventory.sellable_qty (FOR UPDATE)
                  - write inventory_movements (type = sale / send_later_reserved)
                  - write audit_logs row
↓
On success → /app/pos/success/[orderId]
```

**Expected output.**
- Atomically committed sale — no partial writes, no oversell race.
- Receipt success screen with order number, items, total, payment breakdown, PromptPay QR (if used), and registration QR (F12).
- Cart cleared, ready for next customer.
- Cashier perceives <2s from confirm to success screen.
- No customer info required for take-now sales.

---

## F09 — Send Later fulfillment

**Description.** First-class fulfillment type (not a flag). At sale time, the cashier flags a line as Send Later and captures shipping info. Post-event, a queue lets the seller pack → ship → complete.

**Purpose.** Send Later is how booth sellers honor "I want it but you ran out / it's heavy / ship to my house" without losing the sale. Bolting it onto regular orders loses accuracy; making it a separate fulfillment type lets post-event reconciliation be honest.

**Consumer.** P2 at sale time. P1 / P2 post-event in the fulfillment queue.

**Flow.**
```
In POS cart → mark line as Send Later
↓
On confirm → capture shipping info on the same modal
             (name, address, phone, optional Line ID; no pet data here)
↓
create_order RPC writes a `send_later_orders` row tied to the order
↓
event_inventory `send_later_reserved` increments (stock reserved, not deducted)
↓
Post-event → /app/send-later
↓
Filter by event, status (pending / packed / shipped / completed / cancelled)
↓
Mark packed → audit row
Mark shipped → enter tracking number, optional notify customer
Mark completed → event_inventory `send_later_reserved` decrements; `sold` movement written
Cancel → restore stock, refund flow if already paid
```

**Expected output.**
- Each Send Later order ends the event in a known final state — no "unknown" rows.
- Stock reconciliation matches: reserved at sale, decremented at completion, restored at cancel.
- Customer (if they registered via F12) sees their Send Later status in their post-event link.

---

## F10 — Bill void / line correction / partial refund

**Description.** Three related flows: void an entire bill, correct a single line on an existing bill, refund part of a bill with a reason. All atomic via Postgres functions, all audit-logged.

**Purpose.** Cashiers make mistakes during peak hour. The system has to let them recover without a manager. Audit log + before/after capture means recovery doesn't become a hole in the books.

**Consumer.** P2 with permission (cashier role or above). P4 reviews via audit log.

**Flow.**
```
Void:
  /app/pos/orders/<id> → "Void bill" → confirm with reason
  → void_order RPC: mark order void, restore event_inventory, write inventory_movements,
                    write audit_logs (before/after snapshot)

Line correction:
  /app/pos/orders/<id> → edit line (qty / price / discount)
  → correct_order RPC: write new order_items revision,
                       adjust event_inventory delta,
                       write audit_logs with before/after

Partial refund (Wave 26):
  /app/pos/orders/<id> → "Refund line(s)" → reason → confirm
  → partial void of the affected lines + payment_records adjustment + audit
```

**Expected output.**
- Stock and money are always consistent post-correction.
- `audit_logs` carries before/after JSON for each change.
- Admin (P4) can see every void/correction with reason + staff_id.

---

## F11 — Receipt + PromptPay QR

**Description.** The success screen after `create_order`. Shows the receipt, generates a PromptPay payload + QR if PromptPay was used, and surfaces the customer registration QR / share link (handoff to F12).

**Purpose.** The receipt screen is where booth UX hands off to customer UX. It must (a) close the sale visually, (b) display the PromptPay QR with a correct EMVCo payload + CRC16, and (c) offer a one-tap "send registration link" without forcing the cashier to do anything.

**Consumer.** P2 (cashier) for a second. P3 (customer) sees the QRs and scans them.

**Flow.**
```
On create_order success → /app/pos/success/[orderId]
↓
Render receipt: brand header, items, totals, payment breakdown, order number
↓
If PromptPay used → render QR via qrcode lib (Wave 8) from EMVCo payload + CRC16
↓
Server Action call → create_registration_token(order_id) → 16-char token
↓
Render registration QR + share link (Line / SMS) — RegistrationLinkBlock (Wave 40b)
↓
Print button (Wave 18) → browser print
↓
"Next sale" → cart cleared, back to /app/pos
```

**Expected output.**
- A receipt that prints cleanly on A4 + thermal-width via CSS.
- PromptPay QR scans successfully in real Thai banking apps (validated in pilot smoke).
- One single-use registration token per order, valid 90 days.
- Cashier moves to next customer in <5 seconds.

---

## F12 — Customer Portal QR registration

**Description.** Anonymous (no-login) page at `/register/[token]` where the customer self-registers after the sale. Mobile-first, bilingual EN/TH.

**Purpose.** Carry the "checkout first, profile later" architecture all the way through. We get the customer relationship data **without** the cashier having to type during peak. Token-as-credential means no signup, no password, no email verification round trip.

**Consumer.** P3 (booth customer, on their own phone).

**Flow.**
```
Customer scans QR on receipt (or follows Line/SMS link)
↓
/register/[token] loads
↓
Server-side admin lookup validates token (valid + unclaimed + unexpired)
   On invalid → friendly error page with "ask seller for a new link"
↓
Form renders, mobile-first, EN/TH toggle
↓
Customer fills:
  - display name
  - contacts: phone / email / Line (≥1 required)
  - (optional) pet: name, species, breed, birthday, allergies, preferences
  - required consent: "I agree to be contacted about my order"
  - optional consent: marketing
↓
Submit → Server Action → `claim_registration_token(token, payload)` RPC
↓
RPC atomically writes:
  - customers
  - customer_contacts (per channel)
  - pets (vertical module, optional)
  - customer_order_links (links to original order_id)
  - marks token claimed
  - audit_logs
↓
Success page: "We saved your info. See you at the next event."
```

**Expected output.**
- One claimed token per registered customer.
- Linked customer + contact + (optional) pet rows in the seller's workspace.
- Customer's order is linked, so a returning visit can surface their history.
- Anon Supabase key cannot write directly — only the RPC, which validates the token first.

---

## F13 — Customer + pet profile (post-purchase data layer)

**Description.** The data model behind F12: `customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens`. The `pets` table is a **vertical module** — non-pet workspaces have empty pet rows.

**Purpose.** Pet profile is the booth-seller competitive moat against generic POS — *but* implemented as a post-purchase relationship engine, never as a checkout burden. Pets table is opt-in per workspace category in a future config.

**Consumer.** P1 reads customer + pet info to personalize follow-up. P3 owns the data. P4 has audited read access for support.

**Flow.**
```
Write path (always atomic, always token-gated): see F12.

Read path:
  /app/customers → list of registered customers (this workspace)
  Click → drawer with contacts, past orders, pets, lifetime value
  /app/customers/<id> → full profile

No direct INSERT / UPDATE / DELETE RLS policies on these tables.
The only mutation path is `claim_registration_token` (anon, token) or
future cashier-side helpers (Wave 40c+).
```

**Expected output.**
- Per-workspace customer database that survives across events.
- Pet info available for personalization (e.g., "Mochi's birthday is next week").
- Tenant isolation enforced by RLS on every read.
- Admin reads (P4) write to `admin_access_logs` with a reason.

---

## F14 — Returning customer lookup

**Description.** Cashier-side lookup by phone number at the till. Returns the matched customer with past orders + pet preview. Cashier can attach them to the current sale.

**Purpose.** At the next event, recognize the customer without making them re-fill the portal. Cashier asks for phone, system surfaces them. The "returning customer" badge + pet preview drives the cat-niche moat ("Hi! Is this still for Mochi?").

**Consumer.** P2 (cashier).

**Flow.**
```
In /app/pos cart → "Customer" field
↓
Cashier enters phone (Thai phone normalizer applied)
↓
Server Action: lookup_customer_by_contact(workspace_id, 'phone', value)
↓
On match → returning customer panel:
            - customer name
            - last visit (event + date)
            - last 3 orders (total + items)
            - pet preview (if any)
            - "Attach to this sale" button
↓
Attach → cart now carries customer_id; create_order will write customer_order_links
↓
On no match → "Send registration link after sale" prompt (default flow)
```

**Expected output.**
- Phone-based lookup latency <300ms.
- Cashier can attach a known customer to the current cart in <2 taps.
- New `customer_order_links` row written at create_order if a customer was attached.
- The in-cashier `PetCardsBlock` from Wave 35 is removed once F14 is live — pet UI never appears in the cashier flow.

---

## F15 — Daily + multi-period dashboard

**Description.** Real-time tile dashboard for the seller. Tiles: revenue, orders, items sold, top SKU, Send Later pending, stockout risk, peak hour. Day-N switcher + full-event aggregate + period-over-period comparison.

**Purpose.** During a multi-day expo, the seller needs to know how today is going against yesterday and against the last event. Generic POS dashboards are current-day only — that's a field finding from the meowmeow Pet Expo run.

**Consumer.** P1 primary; P2 glances at it between sales.

**Flow.**
```
/app/dashboard → today by default
↓
Toggle: Day 1 / Day 2 / Day 3 / Full Event / Custom range
↓
Compare: vs. previous day / vs. previous event (Wave 34)
↓
Drill into a tile → /app/orders, /app/send-later, /app/products
↓
Live activity feed (Wave 29) on the right rail
↓
Reorder suggestions (Wave 30) surfaced inline
```

**Expected output.**
- Six tiles render <2s on first load.
- Multi-period view works for any closed event (read-only).
- Drills open the underlying record list with the same time-window applied.

---

## F16 — End-of-event CSV export + archive

**Description.** At close-of-event, a CSV bundle is generated: orders, order_items, payment_records, send_later_orders, inventory_movements, dashboard snapshot. The event is then archived — read-only, no new sales accepted.

**Purpose.** Sellers need a portable record they can pull into spreadsheets, accounting, or hand to their accountant. They also need a hard line that says "this event is closed" so no late entries pollute the numbers.

**Consumer.** P1 (owner) at close-of-event.

**Flow.**
```
/app/events/<id>/close-event → confirm
↓
Server Action generates CSV bundle (lib/csv builder, RFC 4180)
↓
Files in bundle:
  - orders.csv
  - order_items.csv
  - payment_records.csv
  - send_later_orders.csv
  - inventory_movements.csv
  - dashboard_snapshot.csv
↓
Bundle delivered (zip or side-by-side — see Open Question #6)
↓
events.status = archived
↓
Event becomes read-only:
  - /app/events/<id>/pos returns 403 with "event is archived"
  - dashboard remains viewable, send-later queue remains workable
  - no new orders accepted
```

**Expected output.**
- CSV totals reconcile to ±0 satang with cash drawer + transfer slip totals.
- Archive is permanent for the workspace's lifetime (data retention TBD).
- No new sales accepted on an archived event.

---

## F17 — Admin operations (apps, codes, workspaces, audit, pilot board)

**Description.** The founder's admin surface. Five pages: `/admin/applications`, `/admin/invite-codes`, `/admin/workspaces`, `/admin/audit-log`, `/admin/pilot-status`.

**Purpose.** Let one solo founder support 5 active pilot sellers end-to-end. Approve, observe, debug, log — without ever giving the founder accidental write access into seller data without a logged reason.

**Consumer.** P4 (admin).

**Flow.**
```
Admin logs in → middleware checks `admin_users` membership
↓
/admin = home with five tiles
↓
/admin/applications → triage (F02)
/admin/invite-codes → outstanding + used; resend / cancel
/admin/workspaces → list with last-activity, status, contact info
                    Click → workspace detail (read-only by default)
                    Any drill into seller data → modal asks for `reason`
                    → audit-logged before content renders
/admin/audit-log → filter by workspace, action, date range
/admin/pilot-status → 5-brand board:
                       brand → onboarded? products? event? first sale? portal claimed?
                              event closed? feedback received?
```

**Expected output.**
- Every admin read of identifiable seller data writes one `admin_access_logs` row.
- Pilot board shows where each of the 5 brands is in the pilot at a glance.
- Service role key is used only inside `/admin/*` Server Actions, never reaches the client.

---

# Cross-cutting requirements

These apply to every module and are non-negotiable for the pilot. Detailed in [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), [PERFORMANCE.md](PERFORMANCE.md), [ACCESSIBILITY.md](ACCESSIBILITY.md).

| Topic | Requirement |
|---|---|
| Performance | Add-to-cart <100ms perceived; confirm-to-success <2s; portal first paint <1.5s on 4G |
| Tenant isolation | RLS on every business table; queries use user session, not service role; verified by test + manual probe |
| Money | THB satang `bigint` everywhere; no floats; CSV totals reconcile ±0 satang |
| Inventory atomicity | `FOR UPDATE` on `event_inventory` in `create_order`; void / correct are symmetric; no negative stock in pilot |
| Audit | Every void / correction / refund / admin access writes an `audit_logs` (or `admin_access_logs`) row in the same transaction |
| Auth | Google + invite code; service role server-only; admin routes gated in middleware + per-page |
| Customer Portal security | 16-char single-use 90-day token; RLS denies anon SELECT on tokens; mutations go through SECURITY DEFINER RPC only |
| i18n | EN/TH toggle on public + POS chrome + customer portal |
| Accessibility | WCAG AA on the cream/brown palette; keyboard nav for cart + checkout |
| Reliability | Vitest on pure-logic libs; Playwright on landing → apply and POS happy path; manual smoke before each pilot seller |
| Data ownership | Seller data private by default; aggregation only after explicit opt-in; admin reads logged |

---

# Open questions

Living list — resolve, don't accumulate.

1. **Naming.** `workspaces`/`workspace_members` (code) vs. `businesses`/`business_members` (ROADMAP). Pick one before public launch.
2. **Invite code expiry.** Confirmed: codes expire. Duration TBD (30 / 60 / 90 days).
3. **Staff invite email consistency.** Seller invite email is manual in pilot (F02); should the staff invite email at onboarding (F04 Step 3) also be manual, or is it OK to automate via Resend earlier?
4. **Discount preset settings UI.** Per-workspace configurable presets confirmed (F08). Where does the seller configure them — onboarding, /app/settings, or first-time POS open?
5. **Pet vertical flag.** Confirmed implicit (`pets` empty for non-pet workspaces, no toggle). Re-confirm before public launch when non-pet verticals onboard.
6. **Returning customer lookup keys.** Phone only in v0.1, or also Line / email / scan-QR? (Round 17 left mid-stream — confirm on resume.)
7. **Admin access logging.** Reuse `audit_logs` or split into `admin_access_logs`?
8. **CSV bundle format.** Single ZIP, or multiple CSVs side by side? Filename convention?
9. **Brand #6.** Pilot pricing for the 5 free pilot brands is clear — what about #6?
10. **Receipt printer support (post-pilot).** Which models when we do add it? Star / Epson / generic ESC/POS?
11. **Data retention.** What does "delete my workspace" mean for `audit_logs` and `inventory_movements` (the audit trail must survive)?
12. **Onboarding video.** 5-minute Loom per pilot seller, or written guide only?

---

# Changelog

| Date | Change | Author |
|---|---|---|
| 2026-05-19 | Verification pass rounds 1–16 (preamble, stack, personas, F01–F13). All claims confirmed except: F02 invite email is manual during pilot (no Resend automation); F02 invite-codes admin page is read-only in pilot (no resend / cancel actions); F08 discount presets are per-workspace configurable with default 20 / 50 / 100 THB. Open Questions updated; F14–F17 + cross-cutting still pending on next pass. | Founder + Claude |
| 2026-05-19 | Restructured to per-module **Flow · Description · Purpose · Consumer · Expected output** format at founder request. | Claude |
| 2026-05-18 | Initial draft. | Claude |
