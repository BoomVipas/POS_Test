# Flows — what happens when you click

> Sequence diagrams of the main MochiPOS user journeys. Each one names the files involved (the "cast list") and the failure modes (so you know where to look when something goes wrong).
> Read after Levels 1–3. Tied to [LEARNING.md](LEARNING.md), [LEARNING_REPO_MAP.md](LEARNING_REPO_MAP.md), and [LEARNING_GLOSSARY.md](LEARNING_GLOSSARY.md).

---

## Why diagrams matter

Reading static code tells you *what each piece does*. Sequence diagrams tell you *what happens at runtime, in what order*. Without that, a bug in the middle of a flow looks like 5 files arguing — with the diagram, it's "ah, step 4 is where it breaks."

---

## Flow 1 — Public application submit (`/apply`)

This is the simplest end-to-end flow currently working in MochiPOS. It's a great mental anchor.

```
PROSPECTIVE        BROWSER             VERCEL/NEXT.JS         SUPABASE          RESEND
   SELLER          (frontend)          (server)               (database)        (email)
     |                |                      |                     |                |
     |  /apply  →     |                      |                     |                |
     |                |  GET /apply  →       |                     |                |
     |                |                      | render page.tsx     |                |
     |                |                      | (server component)  |                |
     |                | ← HTML + Form.tsx    |                     |                |
     |  fills form    |                      |                     |                |
     |  click Submit  |                      |                     |                |
     |                | client validates     |                     |                |
     |                | (Zod via             |                     |                |
     |                |  schema.ts)          |                     |                |
     |                |                      |                     |                |
     |                | call submitApplica-  |                     |                |
     |                | tion(values)  →      |                     |                |
     |                |                      | Run actions.ts      |                |
     |                |                      | "use server"        |                |
     |                |                      | re-validate (Zod)   |                |
     |                |                      | check honeypot      |                |
     |                |                      | INSERT applications →                |
     |                |                      |                     | check RLS:     |
     |                |                      |                     | anon allowed   |
     |                |                      |                     | (public form)  |
     |                |                      |                     | ← row + id     |
     |                |                      | sendEmail(admin) → → → →             |
     |                |                      |                     |                | send
     |                |                      |                     |                | email
     |                |                      | return {ok: true}   |                |
     |                | ← {ok: true}         |                     |                |
     |                | router.push          |                     |                |
     |                | (/apply/success)     |                     |                |
     |  sees thank-   |                      |                     |                |
     |  you page  ←   |                      |                     |                |
```

### Cast list

| File | Role |
|---|---|
| `src/app/apply/page.tsx` | Server component — renders the form wrapper |
| `src/app/apply/Form.tsx` | Client component — `useState`, validation, submit |
| `src/app/apply/schema.ts` | Zod schema — same rules used by client + server |
| `src/app/apply/actions.ts` | Server Action — DB insert + email |
| `src/lib/supabase/server.ts` | Creates server-side Supabase client |
| `src/lib/email/resend.ts` | `sendEmail()` helper |
| `database/rls-policies.sql` lines 32-36 | Allows anon insert |
| `database/schema.sql` table 1 (applications) | The destination row |

### What can go wrong, where

| Failure | Where you'd see it | Fix |
|---|---|---|
| Form fields invalid client-side | DevTools Console; red borders on fields | The Zod schema — adjust if needed |
| `/apply` errors with "not yet wired" | Browser; the `actions.ts` early-return | Set Supabase env vars in `.env.local` |
| RLS rejects the insert | Vercel logs / `npm run dev` terminal | Check `applications_anon_insert` policy in `rls-policies.sql` |
| Duplicate email | Form shows "Already applied" | Working as designed (unique constraint on `email`) |
| Admin email fails silently | Terminal: `[apply] admin notification failed` | Resend API key wrong, or `ADMIN_EMAIL` not set |

### How to trace it yourself

1. Open `/apply` with DevTools → Network tab.
2. Submit the form.
3. Look for a request to `/apply` (POST). Click it.
4. The "Payload" tab shows what got sent. The "Response" tab shows what came back.
5. If something failed, the Vercel/Next dev terminal will have a stack trace.

---

## Flow 2 — App auth gate (`/app` and below)

Every URL under `/app/...` runs this gate before rendering.

```
USER            BROWSER         NEXT.JS LAYOUT            SUPABASE
  |                |                  |                     |
  |  /app  →       |                  |                     |
  |                |  GET /app  →     |                     |
  |                |                  | layout.tsx runs     |
  |                |                  | checkClient()       |
  |                |                  | reads env URL+ANON  |
  |                |                  | (server-side only)  |
  |                |                  |                     |
  |                |                  | env missing?        |
  |                |                  |  → demo mode banner |
  |                |                  | ← render with banner|
  |                |                  |                     |
  |                |                  | env present:        |
  |                |                  | supabase.auth.      |
  |                |                  |   getUser()         |
  |                |                  | (reads JWT cookie)  |
  |                |                  |                     |
  |                |                  | no user?            |
  |                |                  |  → redirect /login  |
  |                |                  |                     |
  |                |                  | has user:           |
  |                |                  | SELECT workspace_id |
  |                |                  | FROM workspace_     |
  |                |                  | members  →          |
  |                |                  |                     | RLS check:
  |                |                  |                     | user_id = auth.uid()
  |                |                  |                     | ← member row
  |                |                  |                     |
  |                |                  | no member?          |
  |                |                  |  → demo mode banner |
  |                |                  |                     |
  |                |                  | SELECT brand_name   |
  |                |                  | FROM workspaces  →  |
  |                |                  |                     | RLS check
  |                |                  |                     | ← row
  |                |                  | render with header  |
  |                |                  | (workspace name +   |
  |                |                  |  nav links)         |
  |                | ← HTML + nav     |                     |
  |  sees /app  ←  |                  |                     |
```

### Cast list

| File | Role |
|---|---|
| `src/app/app/layout.tsx` | The auth gate — runs `checkClient()` on every `/app/*` request |
| `src/lib/supabase/server.ts` | Server-side Supabase client (uses cookie session) |
| `database/rls-policies.sql` | Filters `workspace_members` and `workspaces` by `auth.uid()` |
| `src/proxy.ts` | (Middleware) refreshes session cookies before this runs |

### What can go wrong, where

| Symptom | Most likely cause |
|---|---|
| Always redirected to `/login` even after signing in | Session cookies not being set. Check `src/lib/supabase/server.ts` cookie handling. |
| "Demo mode" banner appears even with Supabase configured | Either env vars empty (check `.env.local`), or user has no `workspace_members` row. |
| Page hangs forever | Database query slow — open Supabase logs to see. |
| Layout shows the wrong brand name | User is in multiple workspaces and `limit(1)` picked the other one. |

### How to trace it yourself

1. Set Supabase env vars and sign in as a user with a workspace.
2. Open `/app` with DevTools → Network tab.
3. Find the request for `/app`. Click it.
4. Headers tab → look for `cookie:` header — that's how the server knows who you are.
5. If you delete the cookie and reload, you should be redirected to `/login`.

---

## Flow 3 — Sale completion at the cashier (the most important flow)

The atomic sale write. This is *the* business-critical flow — if it goes wrong, money or stock is lost.

```
CUSTOMER     CASHIER       BROWSER             VERCEL/NEXT          SUPABASE
   |            |             |                      |                  |
   |  pays   →  |             |                      |                  |
   |            | clicks Sell |                      |                  |
   |            |             | call create_order    |                  |
   |            |             | RPC w/ payload  →    |                  |
   |            |             |                      | Server Action    |
   |            |             |                      | (or future POS   |
   |            |             |                      |  Server Component|
   |            |             |                      |  Action)         |
   |            |             |                      | supabase.rpc(    |
   |            |             |                      |  'create_order') |
   |            |             |                      |  →               |
   |            |             |                      |                  |
   |            |             |                      |                  | Postgres TXN
   |            |             |                      |                  | begin
   |            |             |                      |                  |
   |            |             |                      |                  | check auth.uid()
   |            |             |                      |                  | check is_workspace
   |            |             |                      |                  |   _member(role IN
   |            |             |                      |                  |   [owner,manager,
   |            |             |                      |                  |   cashier])
   |            |             |                      |                  |  → 42501 if no
   |            |             |                      |                  |
   |            |             |                      |                  | SELECT events
   |            |             |                      |                  | FOR UPDATE  ← lock!
   |            |             |                      |                  |
   |            |             |                      |                  | for each item:
   |            |             |                      |                  |   SELECT event_
   |            |             |                      |                  |     inventory FOR
   |            |             |                      |                  |     UPDATE  ← lock!
   |            |             |                      |                  |   check qty avail
   |            |             |                      |                  |    → fail if not
   |            |             |                      |                  |   UPDATE qty -= n
   |            |             |                      |                  |
   |            |             |                      |                  | INSERT orders
   |            |             |                      |                  | INSERT order_items
   |            |             |                      |                  | INSERT payment_
   |            |             |                      |                  |    records
   |            |             |                      |                  | INSERT audit_logs
   |            |             |                      |                  |
   |            |             |                      |                  | commit
   |            |             |                      |  ← order_id      |
   |            |             |  ← {ok, orderId}     |                  |
   |            |             | router.push          |                  |
   |            |             | (/app/pos/success/   |                  |
   |            |             |  [orderId])          |                  |
   |            | sees        |                      |                  |
   |            | receipt  ←  |                      |                  |
```

### Why "FOR UPDATE" matters

Without the `FOR UPDATE` lock, two cashiers selling the last unit at the same time could both succeed (race condition). With the lock, the second cashier's transaction waits for the first to commit, then sees `qty = 0` and fails cleanly. **This is one of the most important lines in the whole codebase.** See `database/functions/create_order.sql` lines 60 and 158.

### Cast list

| File | Role |
|---|---|
| `src/app/app/pos/POSWorkspace.tsx` | Client component — orchestrates UI |
| `src/app/app/pos/CartPanel.tsx` | The cart, where Sell is clicked |
| `src/app/app/pos/ReviewModal.tsx` | Confirmation step before submit |
| `src/lib/pos/cart-store.tsx` | Cart state via React context |
| `src/lib/pos/calc.ts` | Totals math (satang) |
| `database/functions/create_order.sql` | The atomic transaction |
| `database/schema.sql` tables 8-12 | events, event_inventory, orders, order_items, payment_records |
| `database/rls-policies.sql` | RLS on all of the above |

### What can go wrong, where

| Failure | Where it shows up |
|---|---|
| Cashier not in workspace | `errcode 42501` "create_order: forbidden" |
| Event not in workspace | "create_order: event X not in workspace Y" |
| Event status not active | "create_order: event X status is closed" |
| Stock insufficient | Postgres exception inside the function |
| Two cashiers concurrent | One succeeds, one fails clean (FOR UPDATE) |
| Network drop mid-sale | Browser sees timeout; Postgres rolls back the whole transaction |

### Money safety

- Money is `bigint` satang. `1234500 satang = 12,345.00 THB`. No float, no rounding.
- Subtotal, discount, shipping, total all stored separately. The function recomputes them server-side from the items + cart payload — the client cannot lie about totals.

---

## Flow 4 — Customer portal claim (Wave 40b/40a)

Post-purchase: customer scans the QR on their receipt, fills the form, profile is created.

```
CUSTOMER      PHONE BROWSER     VERCEL                SUPABASE
   |              |                |                     |
   |  scans QR →  |                |                     |
   |              | GET /register/ |                     |
   |              | <token>  →     |                     |
   |              |                | page.tsx            |
   |              |                | (server component)  |
   |              |                | validates length    |
   |              |                | <8 → bad-link UI    |
   |              |                |                     |
   |              |                | renders             |
   |              |                | RegisterClient      |
   |              |                | with token prop     |
   |              | ← form HTML    |                     |
   |              |                |                     |
   |  fills form  |                |                     |
   |  + pet info  |                |                     |
   |  click Save  |                |                     |
   |              | client         |                     |
   |              | validates Zod  |                     |
   |              | (schema.ts)    |                     |
   |              |                |                     |
   |              | call claim     |                     |
   |              | (token,        |                     |
   |              |  payload)  →   |                     |
   |              |                | Server Action       |
   |              |                | supabase.rpc(       |
   |              |                |  'claim_           |
   |              |                |   registration_     |
   |              |                |   token')  →        |
   |              |                |                     | Postgres TXN
   |              |                |                     | begin
   |              |                |                     |
   |              |                |                     | SELECT token
   |              |                |                     |  FROM tokens
   |              |                |                     |  → 22023 if not
   |              |                |                     |    found / expired
   |              |                |                     |    / claimed
   |              |                |                     |
   |              |                |                     | INSERT customers
   |              |                |                     | INSERT contacts
   |              |                |                     |   (1+ rows)
   |              |                |                     | INSERT pets
   |              |                |                     |   (0+ rows)
   |              |                |                     | INSERT order_link
   |              |                |                     | UPDATE token
   |              |                |                     |   SET claimed_at
   |              |                |                     | INSERT audit_log
   |              |                |                     |
   |              |                |                     | commit
   |              |                |  ← customer_id      |
   |              |   ← success    |                     |
   |  thank-you   |                |                     |
   |  screen   ←  |                |                     |
```

### The architectural beauty

- **No auth session.** The customer is anonymous. The token IS the credential.
- **Single transaction.** All the writes happen together; if any fails, none persist.
- **One-shot.** The token is single-use; the next attempt fails with `22023`.
- **Audit-logged.** Even though the user is anon, the action is recorded with `user_id = null`.
- **Direct table access denied.** Anon cannot SELECT or INSERT on these tables — only the RPC can.

This is the "checkout first, profile later" architectural rule made concrete.

### Cast list

| File | Role |
|---|---|
| `src/app/register/[token]/page.tsx` | Server component — validates token format, renders client |
| `src/app/register/[token]/RegisterClient.tsx` | Client component — bilingual EN/TH form |
| `src/app/register/[token]/schema.ts` | Zod schema for the customer + pet payload |
| `database/functions/claim_registration_token.sql` | The atomic claim transaction |
| `database/functions/create_registration_token.sql` | Issues the token at sale completion |
| `database/schema.sql` tables 15-19 | customers, customer_contacts, pets, customer_order_links, customer_registration_tokens |

---

## Flow 5 — Returning customer lookup at POS (Wave 40c)

Cashier types a phone; if a customer was registered before, attach them.

```
RETURNING     CASHIER         BROWSER (POS)         VERCEL          SUPABASE
CUSTOMER         |               |                    |                 |
   |             |               |                    |                 |
   |  gives    → |               |                    |                 |
   |  phone      |               |                    |                 |
   |             | types phone   |                    |                 |
   |             |               | onChange           |                 |
   |             |               | useDebouncedValue  |                 |
   |             |               | 300ms              |                 |
   |             |               |                    |                 |
   |             |               | call lookup        |                 |
   |             |               | Returning          |                 |
   |             |               | Customer  →        |                 |
   |             |               | (demo: localStorage|                 |
   |             |               |   query in browser)|                 |
   |             |               |                    |                 |
   |             |               | (real: Server      |                 |
   |             |               |   Action  →        |                 |
   |             |               |                    | SELECT customer |
   |             |               |                    | _contacts +     |
   |             |               |                    | customers WHERE |
   |             |               |                    | phoneKey = X    |
   |             |               |                    |   →             |
   |             |               |                    |                 | RLS scoped to
   |             |               |                    |                 | workspace
   |             |               |                    |                 | ← rows
   |             |               |                    |  ← matches      |
   |             |               |  ← matches         |                 |
   |             |               |                    |                 |
   |             |               | render Returning   |                 |
   |             |               | Customer widget    |                 |
   |             | sees "match"  |                    |                 |
   |             | clicks Attach |                    |                 |
   |             |               | dispatch CartStore |                 |
   |             |               | SET_CUSTOMER       |                 |
   |             |               | (customerId)       |                 |
   |             |               |                    |                 |
   |             |               | (when sale         |                 |
   |             |               |  completes,        |                 |
   |             |               |  customer_order_   |                 |
   |             |               |  link row inserted |                 |
   |             |               |  inside create_    |                 |
   |             |               |  order RPC)        |                 |
```

### Cast list

| File | Role |
|---|---|
| `src/lib/demo/returning-customer.ts` | Pure logic — `lookupReturningCustomer`, `matchToCustomerPatch` |
| `src/app/app/pos/ReturningCustomerLookup.tsx` | Client component — debounced lookup widget |
| `src/lib/hooks/useDebouncedValue.ts` | Generic debounce hook (the 300ms wait) |
| `src/lib/pos/cart-store.tsx` | The cart context — handles SET_CUSTOMER |
| `src/lib/phone/index.ts` | TH-aware phone normalization |

---

## Flow 6 — Admin approval (future, blocked on Supabase)

Currently scaffolded but not wired. Here's what it'll do:

```
ADMIN          BROWSER          VERCEL            SUPABASE          RESEND
  |               |                |                  |                 |
  |  /admin/      |                |                  |                 |
  |  applications |                |                  |                 |
  |     →         |                |                  |                 |
  |               | GET  →         |                  |                 |
  |               |                | layout.tsx       |                 |
  |               |                | (admin gate)     |                 |
  |               |                | check is_admin() |                 |
  |               |                |                  |                 |
  |               |                | SELECT           |                 |
  |               |                | applications  →  |                 |
  |               |                |                  | RLS: admin only |
  |               |                |                  | ← rows          |
  |               | ← table view   |                  |                 |
  |  click row    |                |                  |                 |
  |  → Approve    | call approve   |                  |                 |
  |               | Action  →      |                  |                 |
  |               |                | Server Action    |                 |
  |               |                | UPDATE app SET   |                 |
  |               |                |   status = approved              |
  |               |                | INSERT invite_   |                 |
  |               |                |   codes          |                 |
  |               |                | sendEmail(       |                 |
  |               |                |  inviteTemplate) →                 |
  |               |                |                  |                 | send email
  |               |                | revalidatePath   |                 |
  |               |                | ('/admin/...')   |                 |
  |               | ← updated      |                  |                 |
  |  sees status: |                |                  |                 |
  |  approved  ←  |                |                  |                 |
```

### When this gets wired (Wave 41+)

The applicant receives the email, clicks the invite code link, lands at `/register?code=XXXX`, fills password, and `redeem_invite_code` RPC creates their workspace + first member row in one transaction.

---

## Flow 7 — Login (future, DD-39)

Currently a placeholder. When wired:

```
USER          BROWSER          NEXT.JS            SUPABASE AUTH
  |              |                 |                    |
  | /login →     |                 |                    |
  |              | GET             |                    |
  |              | LoginPage  →    |                    |
  |              |                 | render             |                
  |              | ← form          |                    |
  | email + pw   |                 |                    |
  | submit       |                 |                    |
  |              | call signInWith |                    |
  |              | Password  →     |                    |
  |              |                 | Server Action      |
  |              |                 | supabase.auth.     |
  |              |                 |   signInWith       |
  |              |                 |   Password()  →    |
  |              |                 |                    | verify creds
  |              |                 |                    | ← JWT
  |              |                 | set cookie         |
  |              |                 | redirect /app      |
  |              | ← redirect      |                    |
  | /app  →      |                 |                    |
  | (auth gate   |                 |                    |
  |  succeeds)   |                 |                    |
```

For Google Auth (per ROADMAP), the flow is identical except `signInWithOAuth` redirects to Google's consent screen first, then back to a callback URL where the JWT is exchanged. The pilot still gates by invite code on top.

---

## Practice — pick one flow and trace it

For one flow above, do this:

1. Open all the files in the cast list.
2. Read each file (just enough to see the imports + the main function).
3. Sketch the diagram on paper without looking at the version above. Just from the code.
4. Compare your sketch to the doc. Where did your mental model differ?

That's the muscle that turns "I can read code" into "I understand this codebase."
