# User Flow

## Public visitor (someone who just heard about us)

```
1. Lands on /                     → marketing page, "Apply to join the pilot"
2. Clicks "Apply"                  → /apply
3. Fills owner name, phone, email,
   brand name, IG/FB, # SKUs,      → server action: insert into applications
   # events/year, why us
4. Sees /apply/success             → "We'll email you within 3 working days"
5. (Optional) /apply/status        → enter email, see status (pending/approved/rejected)
```

System side: admin gets an email "New application from <brand>".

## Admin (the founder, manually approving each pilot client)

```
1. Logs in at /login                → Supabase Auth
2. Lands on /admin                  → admin home
3. /admin/applications              → list all applications, filter by status
4. Clicks an application            → review details
5. Clicks "Approve"                 → server action:
                                       - applications.status = approved
                                       - generate invite_codes row
                                       - send invite email via Resend
6. (or) Clicks "Reject"             → applications.status = rejected (no email)
7. /admin/invite-codes              → see issued codes, status, can resend or cancel
8. /admin/workspaces                → see all workspaces and last activity
```

## New client (after approval)

```
1. Receives invite email with code   → "Your code is CATBOOTH-7KQ9-X2LA"
2. Visits /register                  → enter code
3. Code validated server-side        → fetches application's email + brand_name
4. Enters password, confirms brand   → Supabase Auth signup
5. Workspace auto-created            → workspace_id assigned, first member = owner
6. invite_codes row marked used
7. Redirected to /app/setup/products → onboarding step 1: product setup
```

## Client first-time setup

```
1. /app/setup/products              → empty state: "add your first product"
2. Click "+ Add product"
3. Fill SKU, name, category, price,
   stock, send-later allowed,        → server action: insert into products
   upload image                      → image to Supabase Storage bucket
4. Repeat for each SKU
5. Click "I'm done setting up"      → workspaces.setup_complete = true
6. Redirected to /app
```

## Client booth day

```
1. /app                              → home: "Open Event Day" or "Continue Day N"
2. /app/events/new                   → create event (name, venue, dates)
3. /app/events/<id>/start            → enter starting count per SKU (event_inventory)
4. /app/pos                          → product grid, cart, checkout
5. (Each sale)                       → server action: create_order RPC
                                          - inserts orders row
                                          - inserts order_items rows
                                          - inserts payment_records row
                                          - decrements event_inventory
                                          - inserts audit_logs row
6. /app/send-later                   → if any items were marked send_later,
                                       fulfill from this list
7. /app/dashboard                    → live metrics for today
8. /app/events/<id>/close            → end-of-day close action
                                          - marks event status = closed_day_N
                                          - exports day CSV
```

## Client end of event

```
1. /app/events/<id>/close-event     → final close
2. CSV bundle downloaded             → all orders, all send-later, dashboard
3. Send-later list still active      → can still mark as packed/shipped/completed
4. Event archived                    → still readable, no new sales accepted
```

## Critical correctness rules

- **A sale is atomic.** Either all of (orders, order_items, payment_records, event_inventory decrement) happen, or none. This is the `create_order` Postgres function.
- **A void is atomic.** Inverse of create_order. Event_inventory is restored, audit row written.
- **A correction is atomic.** Edits an existing order; audit row records before/after.
- **Inventory cannot go negative** unless explicitly allowed (not allowed in pilot).
- **Two staff cannot sell the last unit.** Postgres SELECT FOR UPDATE on event_inventory row inside the function.

## Customer Portal flow (post-purchase, Wave 40)

> Architectural rule, [PROJECT_VISION.md](PROJECT_VISION.md): customer + pet profile must never block the cashier flow. Profiles are captured **after** the sale via QR or shareable link.

```
At checkout
1. Cashier completes a sale.                  → create_order RPC writes the
                                                 order atomically.
2. Receipt success screen renders.            → Server Action calls
                                                 create_registration_token(order_id).
                                                 Returns 16-char token.
3. Receipt shows a QR + share link            → URL: /register/{token}
   (also "Send by Line/SMS" buttons).         → cashier moves on to the next sale.

Customer portal (anon)
4. Customer scans QR (or follows the link).   → Mobile-first /register/[token]
                                                 page.
5. Server fetches token row server-side       → renders form when token is
   (admin-scoped lookup; never exposes           valid + unclaimed + unexpired.
   tokens to anon SELECT).                       Otherwise shows error state.
6. Customer fills form (optional fields):     → preferred contact method,
   - display name                                phones / emails / line ids,
   - contacts (phone / email / line)             pet name + species + breed +
   - pets (vertical module, optional)            birthday + allergies, consent.
7. Submit → Server Action calls               → claim_registration_token RPC,
   claim_registration_token(token, payload).     anon-callable. Atomically writes
                                                 customer + contacts + pets +
                                                 customer_order_links rows;
                                                 marks token claimed; audit-logs.
8. Success page                               → "We saved your info. See you at
                                                 the next event."

Repeat customer at the next event
9. Cashier asks for phone or scans loyalty QR. → Server Action (Wave 40c)
                                                  looks up customer_contacts
                                                  by (workspace_id, channel,
                                                  value).
10. POS surfaces "returning customer" badge    → customer_id, pet preview,
    with past purchases.                         past order history. Cashier
                                                 can attach to current sale.
```

Token rules: 16 random chars, single-use, 90-day expiry. The token IS the credential — the portal flow has no auth session. Without a valid token, `claim_registration_token` aborts with `errcode = '22023'`. Direct anon SELECT on `customer_registration_tokens` is denied by RLS; tokens only become readable through the SECURITY DEFINER RPCs.
