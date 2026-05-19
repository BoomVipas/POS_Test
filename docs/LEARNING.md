# Founder Learning Path — MochiPOS

> Started 2026-05-07. Source: [ROADMAP.md § 13](ROADMAP.md). Goal: founder can read the MochiPOS repo, guide AI agents, review work, and make architectural calls — not become a full-time engineer.

> **Landing page in the app:** when the dev server is running, open `http://localhost:3000/learn` for a visual table of contents with the current "today" callout, the 5 levels as tiles, and links to every reference doc.

## Demo navigation map

MochiPOS has four audiences and four surfaces. When you run `npm run dev`, each URL below opens the section for that audience. Demo data is mocked — no real database needed.

| For | Surface | Key URLs |
|---|---|---|
| Future sellers | **Public marketing** — where new pet brands sign up. The first screen you see when you open the dev server (easy to mistake for the whole app). | `/`, `/apply` |
| Sellers at the booth | **Cashier app** — the heart of the product. Rings up sales, manages inventory, closes the day. | **`/app/pos` (start here)**, `/app/dashboard`, `/app/customers`, `/app/send-later`, `/app/stock-count`, `/app/close-day`, `/app/setup/products` |
| You (the founder) | **Platform admin** — approve seller applications, manage workspaces, watch the audit log. | `/admin/applications`, `/admin/workspaces`, `/admin/invite-codes`, `/admin/audit-log` |
| Pet owners | **Customer-facing** — what the customer sees: scan QR at the booth to browse the menu (`/qr-menu`), or after a purchase claim a pet profile via the token link on their receipt (`/register/[token]`). | `/qr-menu` |

> **First time exploring?** Start `npm run dev`, then open `http://localhost:3000/app/pos` — that's the actual POS the cashier uses. The marketing landing at `/` is the seller-onboarding flow, not the app itself.

## How this curriculum works

- **One level at a time.** No skipping ahead. Each level builds on the previous.
- **Every concept anchors to a real file in MochiPOS.** No abstract textbook examples.
- **Every concept anchors to a booth / family-business analogy.** Tie new ideas to what you already know.
- **Each level ends with one hands-on exercise (10–20 min) inside this repo.** You don't graduate until you do it.
- **Don't memorize. Recognize.** The goal is "I can read this file and tell you what it is" — not "I can write this from scratch."
- **Ask anytime.** Every level has a "common confusion" section, but if something else trips you up, stop me.

## Companion documents

- [LEARNING_GLOSSARY.md](LEARNING_GLOSSARY.md) — every technical term you'll see, in plain language. Look things up here whenever a word is unfamiliar.
- [LEARNING_REPO_MAP.md](LEARNING_REPO_MAP.md) — annotated tour of where everything lives in this repo. Open this when you're lost.
- [LEARNING_ERRORS.md](LEARNING_ERRORS.md) — what error messages mean and how to read them. Open this when something breaks.
- [LEARNING_FLOWS.md](LEARNING_FLOWS.md) — sequence diagrams of the main user journeys (apply, sale, customer portal, returning-customer lookup, admin approval). Read after Level 3.
- [LEARNING_AI_WORKFLOW.md](LEARNING_AI_WORKFLOW.md) — how to brief, review, and verify AI-generated work on this codebase. Read whenever you want to ship faster without losing safety.
- [LEARNING_TYPESCRIPT.md](LEARNING_TYPESCRIPT.md) — 10-minute cheat sheet for reading TypeScript without learning to write it.

## What you do NOT need to learn

To save you stress — you can skip these for the foreseeable future:

- React internals (hooks, fiber, rendering rules beyond "client vs server")
- CSS specificity / cascading rules (Tailwind handles this)
- Complex SQL (joins, window functions, CTEs) — only basic SELECT/INSERT/UPDATE
- DevOps (Docker, Kubernetes, Linux admin)
- Git internals (just commit / branch / PR)
- TypeScript advanced types (generics, conditional types, etc.)
- Build pipelines (Webpack, Turbopack, esbuild internals)
- Browser engine internals
- Performance tuning beyond reading dashboards

If an AI agent ever shows you any of those and you don't follow it, that's fine — say "explain in booth terms" and you'll get an answer.

## Progress

- [x] **Level 1 — Web app basics** (taught 2026-05-07; exercise still pending — see Resume here for what's happened since)
- [ ] Level 2 — Next.js structure
- [ ] Level 3 — Supabase basics
- [ ] Level 4 — Deployment flow
- [ ] Level 5 — SaaS architecture
- [ ] Bonus — Mini project: add one small feature to the Product Setup page

## Resume here (next session)

**Where we left off:**
- **2026-05-07** — Level 1 taught in chat. Founder paused before doing the DevTools exercise.
- **2026-05-18** — Founder returned, ran the demo, but only saw the marketing/apply page and assumed "this is the whole app." We walked through the 4 audience surfaces in chat. Shipped Demo navigation map to `/learn` and to this doc (PRs #16, #17) so the orientation gap is solved permanently — anyone hitting the demo cold can now find `/app/pos` and the other surfaces without asking.

**Status:** Level 1 still ungraduated. The 5 concepts (frontend, backend, database, hosting, API) landed, but the DevTools Network-tab exercise is still owed. Founder also hasn't yet narrated what `/app/pos` looks like in their own words.

**Next session opening move:**
1. **Orientation first:** "Have you clicked around `/app/pos` since? What did the cashier screen look like to you?" They should describe a product grid plus a cart on the right.
2. If yes — short debrief, then run the DevTools exercise from Level 1 (Network tab investigation).
3. If no — walk them through `/app/pos` first (3 min), then the DevTools exercise.
4. Only then move to Level 2.

**Don't:** dump Level 2 before confirming Level 1 landed — both the concepts AND the hands-on exercise.

---

## Level 1 — Web app basics

### Why this level matters

If you don't have a clear mental picture of *frontend vs backend*, every architectural choice in MochiPOS will feel arbitrary. Once you do, choices like "why is `create_order` a Postgres function and not JavaScript?" become obvious — not memorized rules.

### The 5 concepts

| Concept | Plain language | MochiPOS anchor | Booth analogy |
|---|---|---|---|
| **Frontend** | The screen the user looks at and clicks. Runs in the user's browser/tablet. Anyone with DevTools can see it. | All `.tsx` files in `src/app/...` that have `"use client"` at the top, e.g. `src/app/apply/Form.tsx` | The **cashier** at the front of the booth. Visible, fast, friendly. |
| **Backend** | Code that runs on a server, never on the user's device. Does anything the browser can't be trusted with: talk to the DB, send email, decrement stock atomically. | Postgres functions in `database/functions/` (e.g. `create_order.sql`). Server Actions like `src/app/apply/actions.ts`. Server components like `src/app/page.tsx` (no `"use client"` line). | The **manager** in the back room. Verifies, signs, files the receipt. |
| **Database** | Long-term memory. Survives when the page closes or the server restarts. | Supabase Postgres tables — see `database/schema.sql` (e.g. `products`, `orders`, `event_inventory`). | The **locked file cabinet** — every receipt, every count, every customer record. |
| **Hosting** | Where the app lives so anyone on the internet can reach it. | **Vercel** runs the Next.js app. **Supabase** runs the database, auth, file storage. | The **warehouse** — the physical place where the cashier, the manager, and the file cabinet all live. |
| **API** | The language the frontend uses to ask the backend to do something. "Give me the products." "Save this order." | Next.js Server Actions (functions exported from `actions.ts` files). A few direct Supabase queries from server components. | The **intercom** between the cashier and the manager. |

### The whole picture in one diagram

```
Cashier's tablet (frontend, in browser)
        ↓ API call (Server Action)
Vercel server (Next.js Server Action = backend)
        ↓ SQL / RPC call
Supabase Postgres (database) ← locked file cabinet
        ↓ (sometimes also)
Resend (email — also backend)
```

### The single most important rule

**Frontend can be tampered with. Backend cannot.**

Anyone can open DevTools and change frontend code. Anyone can send fake requests. So:

> Anything that affects money, stock, or trust must be enforced by the backend — not the frontend.

That's why MochiPOS sells through `create_order` (a Postgres function on the server), not through JavaScript in the browser. The browser **asks** to sell. The server **decides** whether to allow it.

### Common confusion

- *"Why does the page sometimes load instantly and sometimes show a flash?"* — Server components render on the server (instant). Client components render in the browser (one frame of nothing first). MochiPOS uses both.
- *"Where do `process.env.SUPABASE_SERVICE_ROLE_KEY` and similar live?"* — In `.env.local` on your laptop, in Vercel project settings in production. Frontend code can never read them; only backend can. (Variables prefixed `NEXT_PUBLIC_` are the exception — those are fine for frontend.)
- *"If the database is the source of truth, why does the app keep state in localStorage?"* — Right now MochiPOS runs in *demo mode* with no Supabase connected; localStorage is a temporary stand-in. When real Supabase is wired up, demo storage goes away. (See `src/lib/demo/` for everything that's currently demo-only.)

### Exercise — see the conversation yourself (10 min)

1. Open Terminal in the `pos-for-sell/` folder.
2. Run: `npm run dev`
3. Wait for "Ready in X.Xs" and a `localhost:3000` URL.
4. Open `http://localhost:3000` in your browser.
5. Press **F12** to open DevTools. Click the **Network** tab.
6. Click the small "trash can" icon to clear the list.
7. Click around: visit `/apply`, `/app`, `/app/pos`.
8. Each row IS one message between frontend and backend. Click any row → see Headers (request) and Response (server's reply).

### You graduate Level 1 when

You can answer:
- Which row was the actual page (HTML)?
- Which rows were images, fonts, stylesheets?
- When you submitted `/apply`, did you see the form data going to the server?
- What's one thing the backend does that the frontend cannot be trusted to do?

---

## Level 2 — Next.js structure

### Why this level matters

The MochiPOS repo has hundreds of files. Without a mental model for "what kind of file is this," they all blur. Next.js's App Router has a clear convention — once you see it, the repo organizes itself in your head.

### The 5 concepts

| Concept | Plain language | MochiPOS anchor | Booth analogy |
|---|---|---|---|
| **Page** | One URL = one `page.tsx` file inside `src/app/...`. The folder path becomes the URL path. | `src/app/apply/page.tsx` → URL `/apply`. `src/app/app/pos/page.tsx` → URL `/app/pos`. | One booth section = one display table. |
| **Layout** | Wraps every page underneath it. Shared header, navigation, auth check. One `layout.tsx` per folder. | `src/app/layout.tsx` (whole site). `src/app/app/layout.tsx` (every `/app/*` URL — adds header, nav, auth gate). | The booth tent — covers everything inside. |
| **Server Component** | Default. Runs on the server. Cannot use `useState`, `onClick`, or any browser-only feature. Can `await` database calls directly. | `src/app/page.tsx` (the landing page). `src/app/app/layout.tsx`. | The manager wrote the form before you sat down — it's static when it reaches you. |
| **Client Component** | Has `"use client"` at the top. Runs in the browser. Can have `useState`, `onClick`, animations. | `src/app/apply/Form.tsx` — needs `useState` for the input, so it must be a client component. | The cashier interacting in real time — clicking, typing, reacting. |
| **Server Action** | A function that runs on the server but you call it from a client component as if it were local. The framework handles the network call invisibly. | `src/app/apply/actions.ts` — the `submitApplication` function. `Form.tsx` imports it and calls it on submit. | The cashier presses the intercom and the manager replies — but you write it as one continuous conversation. |
| **Environment variable** | A piece of config (URL, secret) that's different per environment (dev, staging, prod). Read via `process.env.NAME`. | `process.env.NEXT_PUBLIC_SUPABASE_URL` (frontend OK). `process.env.SUPABASE_SERVICE_ROLE_KEY` (backend only — leak = disaster). | Different keys for the office vs the warehouse. |

### Folder structure as URL structure

```
src/app/
├── page.tsx                  → /
├── layout.tsx                → wraps everything
├── apply/
│   ├── page.tsx              → /apply
│   ├── Form.tsx              → (component used by page.tsx, NOT a route)
│   ├── actions.ts            → server action
│   ├── schema.ts             → form validation rules
│   └── success/
│       └── page.tsx          → /apply/success
├── login/
│   └── page.tsx              → /login
├── admin/
│   ├── layout.tsx            → wraps every /admin/* page (admin gate)
│   ├── page.tsx              → /admin
│   └── applications/
│       └── page.tsx          → /admin/applications
├── app/
│   ├── layout.tsx            → wraps every /app/* page (auth gate, nav header)
│   ├── page.tsx              → /app  (the seller home)
│   ├── pos/
│   │   ├── page.tsx          → /app/pos
│   │   ├── POSWorkspace.tsx  → (component, has "use client")
│   │   ├── ProductGrid.tsx   → (component)
│   │   └── ...
│   └── ...
└── register/
    └── [token]/              → dynamic — [token] is a placeholder
        └── page.tsx          → /register/abc123, /register/xyz789, etc.
```

**Rules:**
- `page.tsx` = a real URL. Anything else (`Form.tsx`, `Actions.tsx`, `mock-data.ts`) is just a regular file imported by other files.
- A folder name in `[brackets]` = dynamic part of the URL.
- A `layout.tsx` wraps every page in its folder + subfolders.

### How a `<form>` actually submits in MochiPOS

Open `src/app/apply/Form.tsx` and look at lines 1-3:

```tsx
"use client";
...
import { submitApplication } from "./actions";
```

That's a client component (browser) **importing** a server action (server). When the user submits, it looks like a function call:

```tsx
const res = await submitApplication(values);
```

But under the hood, the framework:
1. Serializes `values` to JSON
2. Sends an HTTP POST to the server
3. The server runs `submitApplication` from `actions.ts`
4. Returns the result as JSON
5. Resolves your `await`

This is the same intercom pattern from the booth analogy — but Next.js makes it look like a single conversation in your code. **No need to write the API by hand.** That's why most MochiPOS Server Actions live in `actions.ts` files.

### Common confusion

- *"How do I know if a file is server or client?"* — Look for `"use client"` on line 1. If it's there, browser. If not, server.
- *"Why isn't my `console.log` showing up?"* — In a server component, it logs in the **terminal where `npm run dev` is running**, not in browser DevTools. In a client component, it logs in DevTools.
- *"Why can't a server component use `onClick`?"* — Server components are static HTML by the time they reach the browser. There's no JavaScript bundle attached. To handle clicks, the user needs JS — that means a client component.
- *"`Form.tsx` is in the same folder as `page.tsx` — why isn't `/apply/Form` a URL?"* — Because only `page.tsx` (and a few other special names like `layout.tsx`, `loading.tsx`) become URLs. Other files are just regular modules.

### Exercise — read the apply form end-to-end (15 min)

1. Open `src/app/apply/page.tsx` in your editor. (~30 lines.) This is a *server* component (no `"use client"`). It just renders a form wrapper.
2. Open `src/app/apply/Form.tsx`. Note line 1: `"use client"`. This is the form input. It uses `useState`, so it must be a client component.
3. Open `src/app/apply/actions.ts`. Note line 1: `"use server"`. This is the server action that runs when the user submits.
4. Open `src/app/apply/schema.ts`. This defines the validation rules (Zod schema). Both the client (line 8 of `Form.tsx`) and the server (line 6 of `actions.ts`) import it — same rules, both sides.
5. **Make a tiny edit:** in `src/app/page.tsx`, find the kicker text and change it (e.g., add a "🐱" emoji — but wait, the user said no emoji unless asked, so just change the text). Save. Look at the browser. The page should update without you reloading. That's hot reload.
6. Now make the same kind of small text edit in `src/app/apply/actions.ts` (e.g., change the error message string in the unique-email branch). Save. The browser doesn't refresh automatically because it's server code — but next time you submit the form, your new text appears.

### You graduate Level 2 when

You can answer:
- Which file in `src/app/app/pos/` is the URL `/app/pos`?
- Which files in that folder are NOT URLs but components used by `page.tsx`?
- In `src/app/apply/`, which file has `"use client"` and which has `"use server"`?
- What does `src/app/app/layout.tsx` do for every URL under `/app/...`?
- If you wanted to add a `/dashboard` URL, what file would you create where?

---

## Level 3 — Supabase basics

### Why this level matters

The database is the only thing that survives a server restart. It's where all real money + stock + customer data lives. If you can read `database/schema.sql` and tell me what each table is for, you can review any AI-generated change for safety.

### The 7 concepts

| Concept | Plain language | MochiPOS anchor | Booth analogy |
|---|---|---|---|
| **Table** | A spreadsheet. Has named columns. Each row is one record. | `products` table in `database/schema.sql` — one row per product card. | One file folder per topic in the file cabinet. |
| **Row** | One record in a table. | One row in `products` = one product. | One receipt in the folder. |
| **Column** | One field on every row. Has a fixed type (`text`, `int`, `bigint`, `uuid`, `timestamptz`). | `products.price_satang bigint` — every product has a price stored as integer satang. | One field on every receipt: "amount", "date", "method". |
| **Primary key** | The unique ID of a row. Almost always a `uuid`. | `products.id uuid` — auto-generated. | The receipt number. |
| **Foreign key** | A column that points to another table's primary key. Enforces "this product belongs to this workspace." | `products.workspace_id` references `workspaces.id`. | Receipt has "for booth 3" — and booth 3 is a real booth. |
| **RPC (Postgres function)** | Code that runs *inside the database*. Can do many things in one transaction (all-or-nothing). | `create_order(payload jsonb)` in `database/functions/create_order.sql` — inserts the order, decrements stock, writes audit, all atomically. | The manager performs the whole receipt-write + stock-deduct ritual without anyone interrupting. |
| **RLS (Row Level Security)** | A rule on a table that says "this user can only see/change rows where X." Enforced by the database itself, not by app code. | `database/rls-policies.sql` — every business table has a policy filtering by `workspace_id`. | The file cabinet has built-in locks. Even if the cashier sneaks in, they can only open their own folder. |

### Tour of `database/schema.sql`

Open `database/schema.sql` and skim it. The tables are numbered as comments. Here are the ones you should recognize:

| # | Table | What it is |
|---|---|---|
| 1 | `applications` | Public form submissions (anyone can submit). Has no `workspace_id` — pre-tenancy. |
| 2 | `admin_users` | Platform admins. Allowlist. Separate from workspace owners. |
| 3 | `invite_codes` | One-shot codes emailed after admin approves an application. |
| 4 | `workspaces` | One row per pilot client. **The tenancy boundary.** Everything else points to this. |
| 5 | `workspace_members` | Which auth user belongs to which workspace, with what role. |
| 6 | `products` | Product cards. `workspace_id` ties it to one tenant. |
| 8 | `events` | One booth/fair per row. |
| 9 | `event_inventory` | Per-product stock at an event. Has `current_qty`, `sample_qty`, `sold_qty`, etc. |
| 10 | `orders` | Sale headers. Has `total_satang`, `payment_method`, `customer_phone` (optional). |
| 11 | `order_items` | One row per SKU sold. |
| 12 | `payment_records` | Multiple payments per order possible (split: cash + transfer). |
| 13 | `send_later_orders` | Fulfillment data when items are shipped post-event. |
| 14 | `audit_logs` | Append-only history of important actions. |
| 15+ | `customers`, `customer_contacts`, `pets`, `customer_order_links`, `customer_registration_tokens` | Customer Portal (Wave 40a). |

Notice how every business table has `workspace_id`. **That's the tenancy rule** — see Level 5.

### Money in MochiPOS

> All money stored as `bigint` representing **THB satang** (1 THB = 100 satang). Display formats to "1,234.50 THB".

Why? Floating-point math is unreliable for currency. Storing satang (integer) means `1234.50 THB = 123450 satang` — exact, no rounding bugs. Anywhere you see `_satang` in a column name, that's the unit.

### What is `security definer`?

Open `database/functions/create_registration_token.sql`. Line 13 says `security definer`. That means: when this function runs, it runs with the owner's permissions (usually the database admin), not the calling user's permissions. This is how MochiPOS lets a regular cashier do something normally restricted (like writing audit logs) — but only inside this controlled function.

This is important: it's why MochiPOS can enforce "you can only sell, you can't update audit logs directly" — and still allow `create_order` to do both atomically.

### What is RLS in plain language?

Open `database/rls-policies.sql`. Every business table starts with:

```sql
alter table public.products enable row level security;
```

That single line means: from now on, every SELECT/INSERT/UPDATE/DELETE against `products` will be filtered by the policies below. Without a matching policy, the user sees nothing.

Then you'll see policies like:

```sql
create policy products_select
  on public.products for select
  to authenticated
  using (public.is_workspace_member(workspace_id));
```

Plain English: "an authenticated user can SELECT a row of products only if they're a member of that row's workspace."

**This is enforced inside the database.** Even if frontend code accidentally sends `select * from products`, the database silently filters to only the user's workspace. You cannot leak another tenant's data even by mistake.

### Common confusion

- *"Why is the price `1234500` instead of `12345.00`?"* — Because money is stored as satang to avoid float bugs. Format on the way out, never on the way in.
- *"Why a Postgres function instead of just running SQL from the app?"* — Atomicity. `create_order` does 4+ things; if any fails, all roll back. App-level "do A then B then C" can leave you with A done and B failed. Database transactions prevent that.
- *"Why is `applications` allowed to be inserted by anyone (`to anon`)?"* — Because the `/apply` form is public. We trust *insertion* (anyone can fill out the form) but not *reading* (only admins can see applications). That's the policy on lines 32-46 of `rls-policies.sql`.

### Exercise — read the schema yourself (20 min)

1. Open `database/schema.sql`. Find the `products` table (search "create table if not exists public.products"). Identify:
   - What is its primary key?
   - Which column makes it tenant-scoped?
   - Which column stores the price, and in what unit?
2. Open `database/rls-policies.sql`. Find the section for `products`. Read the SELECT policy out loud in plain English.
3. Open `database/functions/create_order.sql`. Read lines 1-50. You don't need to understand every line — just identify:
   - What does it return? (Hint: line 24)
   - What does it check on lines 47-54 before doing any work?
   - Why does it lock the event row "FOR UPDATE" on line 60?
4. **Stretch goal (optional):** sign up at https://supabase.com (free tier). Create a project named "mochipos-learning". Open the SQL Editor and paste `database/schema.sql`. Run it. Then click "Table Editor" in the sidebar — you should see all the tables you just read about. (You don't need to seed any data; just see them exist.)

### You graduate Level 3 when

You can answer:
- What does "money stored as satang" mean and why?
- What is `workspace_id` and which tables have it?
- In one sentence, what does RLS do?
- Why is `create_order` a Postgres function, not just JavaScript code?
- If a cashier with `role = 'cashier'` tries to delete a row in `products`, what stops them? (Look at the products policies in `rls-policies.sql`.)

---

## Level 4 — Deployment flow

### Why this level matters

Right now MochiPOS only runs on your laptop. To pilot with 5 sellers, it must run on the internet, deploy automatically when you merge changes, and stay safe (env vars per environment, no leaking dev secrets to prod). This level connects everything to the live world.

### The 6 concepts

| Concept | Plain language | MochiPOS anchor | Booth analogy |
|---|---|---|---|
| **Branch** | A copy of the code you can edit without affecting the main version. | `git branch pos/wave-41-...` — every batch lives on its own branch. `main` is the trunk. | A draft of a new menu, kept aside until you decide it's ready. |
| **Commit** | One saved snapshot on a branch. | `git commit -m "[Wave 41] ..."` | Marking a version of the menu draft. |
| **Pull request (PR)** | A request to merge a branch into main, with a description and review. | The PRs you've seen merged: #4, #5, #6, #8, #9, #10, #11. | "Manager, please review my new menu before we put it on the booth." |
| **Preview deployment** | Vercel automatically builds every PR and gives it a unique URL. You can click around the PR's version of the app before merging. | Vercel posts the preview link as a comment on each PR. | A pop-up booth set up in the back so you can test the new menu without scaring real customers. |
| **Production deployment** | When a PR merges into `main`, Vercel rebuilds and pushes the new version to the real URL (e.g., `mochipos.vercel.app`). | The live MochiPOS. | The actual booth at the actual event. |
| **Environment variable per environment** | Different secrets for "dev on laptop" vs "preview on Vercel" vs "production on Vercel". | `.env.local` (laptop), Vercel project settings (preview + prod). | Different keys for the warehouse, the office, and the booth. |

### The development → production journey

```
1.  Edit code on laptop          (npm run dev — http://localhost:3000)
2.  git commit -m "[Wave 41] ..."
3.  git push origin pos/wave-41-...
4.  Open PR (gh pr create or GitHub website)
5.  Vercel auto-builds preview   (https://mochipos-git-wave41.vercel.app)
6.  You click around preview, verify it works
7.  Merge PR (gh pr merge --squash --delete-branch)
8.  Vercel auto-rebuilds production
9.  Visit https://mochipos.vercel.app — your change is live
```

### Why preview deployments matter

In Project 1 (Meowmeow Event POS), there's no preview. You opened the HTML file, tested locally, then if you broke something, you broke it for everyone the next time you opened it on the booth tablet. **In MochiPOS, you cannot break production without going through a preview first.** That's a huge safety upgrade for the booth.

### What's in `.env.local` vs Vercel?

| Variable | Purpose | Who can read it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project's URL | **Frontend + backend** (NEXT_PUBLIC_ prefix means safe for browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anonymous (public) key for Supabase | Frontend + backend (limited by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | The all-powerful Supabase key — bypasses RLS | **Backend only**. If this leaks, attackers can read every tenant's data. |
| `RESEND_API_KEY` | API key for sending emails | Backend only |
| `EMAIL_FROM` | The "From:" address on outbound email | Backend only |
| `ADMIN_EMAIL` | Where new-application notifications go | Backend only |

**Rule of thumb:** if a variable controls money, secrets, or database superpowers, it must NOT have `NEXT_PUBLIC_` in front of it. The `NEXT_PUBLIC_` prefix tells Next.js "ship this to the browser" — anything you put there is publicly visible.

### Common confusion

- *"What's the difference between staging and production?"* — In MochiPOS, "preview" plays the staging role. Every PR gets its own preview URL. Production is just the URL pointing at `main`.
- *"If I change `.env.local`, do I need to redeploy?"* — No, because `.env.local` only affects your laptop. Production env vars live in Vercel project settings; changing those triggers a redeploy.
- *"Why does merging to main auto-deploy production?"* — That's how Vercel is configured by default for GitHub-connected repos. You can change it later if you want manual deploys.

### Exercise — provision Supabase + Vercel and deploy (60 min)

This is the longest exercise because it unblocks everything that's currently in "demo mode."

**Part A — Supabase (~15 min):**
1. Go to https://supabase.com and sign up.
2. Create a new project. Name: `mochipos-learning` or `mochipos-pilot`. Region: closest to Bangkok (Singapore is fine). Pick a strong DB password and save it.
3. Once the project is ready, go to **Settings → API**. Copy three values into a new file `pos-for-sell/.env.local` (use `pos-for-sell/.env.example` as the template):
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
4. Open the **SQL Editor** in Supabase. Paste the entire content of `database/schema.sql`. Run.
5. Same SQL Editor: paste `database/rls-policies.sql`. Run.
6. (Optional) paste `database/seed.sql` after creating one auth user via the app.
7. In **Storage**, create two buckets:
   - `product-images` — public read.
   - `payment-slips` — private (signed URLs only).
8. Restart `npm run dev`. The "demo mode" banner in `/app` should disappear (you'll be redirected to `/login` instead because there's no session yet — that's normal).

**Part B — Vercel (~20 min):**
1. Make sure your code is pushed to GitHub (it already is).
2. Go to https://vercel.com and sign up with GitHub.
3. Click "Add New → Project" → import the `meowmeow_sandbox` repo.
4. **Critical:** set "Root Directory" to `pos-for-sell` (this repo is a monorepo).
5. In "Environment Variables", paste the same 3 Supabase keys from `.env.local`.
6. Click Deploy. Watch the build logs (~2 min).
7. When it's done, click the URL — you should see the MochiPOS landing page on the open internet.

**Part C — Make a change and watch it deploy (~10 min):**
1. On your laptop, create a new branch: `git checkout -b learning/first-deploy`.
2. Edit `src/app/page.tsx` — change one piece of text (e.g., the kicker).
3. `git commit -am "[learning] my first deploy"`.
4. `git push -u origin learning/first-deploy`.
5. Open the PR on GitHub. Wait ~30 seconds — Vercel posts a comment with a preview URL.
6. Click the preview URL — your change is visible there.
7. Compare: visit production URL — your change is NOT there yet.
8. Merge the PR. Wait ~2 min. Refresh production — your change is now live.

### You graduate Level 4 when

You can answer:
- What's the difference between `.env.local` and Vercel project settings?
- Why is `SUPABASE_SERVICE_ROLE_KEY` not prefixed with `NEXT_PUBLIC_`?
- When you push a branch to GitHub, what does Vercel automatically do?
- If your PR's preview looks broken, can you safely merge to main?
- What's the URL pattern for a Vercel preview vs production?

---

## Level 5 — SaaS architecture

### Why this level matters

This is the level that turns "I can read the repo" into "I can guide architectural decisions." A SaaS lives or dies on tenant isolation: one seller seeing another seller's data even once is a trust-killing event. This level makes the rule muscle-memory.

### The 6 concepts

| Concept | Plain language | MochiPOS anchor | Booth analogy |
|---|---|---|---|
| **Tenant** | One customer of the SaaS. In MochiPOS each tenant = one **workspace** = one pet brand. | `workspaces` table — one row per pilot client. | One pet brand renting a booth at the expo. |
| **Tenant ID** | The column on every business table that says which tenant the row belongs to. | `workspace_id uuid` — almost every business table has it. | The booth number written on every receipt. |
| **Auth (authentication)** | Verifying who someone is. | Supabase Auth — when a user logs in, every request gets a JWT token; the database reads it as `auth.uid()`. | Manager's ID badge. |
| **Authz (authorization)** | Deciding what someone is allowed to do. | `workspace_members.role` (`owner`, `manager`, `cashier`, `stock_staff`, `viewer`). RLS policies check this. | Cashier can sell, but only the manager can void a receipt. |
| **Data isolation** | One tenant cannot see, modify, or even count another tenant's data. | Every RLS policy filters by `workspace_id` via `is_workspace_member()`. | The file cabinet has individual locks per booth — even if you're inside the warehouse, you can only open your own folder. |
| **Audit log** | An append-only record of important actions. Even admins shouldn't be able to delete history. | `audit_logs` table. Every important RPC writes to it (see end of `create_order.sql`). | The handwritten ledger nobody is allowed to erase. |

### The single most important rule of MochiPOS

> **Every query and every RLS policy on a business table must filter by `workspace_id`. No exceptions.**

This is non-negotiable. If even one query forgets, you've leaked data. The structure of MochiPOS is designed so this is hard to forget:

1. The schema *defines* `workspace_id` on every table (run the grep below to see).
2. RLS *enforces* the filter in the database — even buggy app code can't escape it.
3. The Postgres functions (`create_order` etc.) explicitly check `is_workspace_member(workspace_id, ...)` before doing anything.

Three layers of defense.

### Trace the tenant rule yourself

Open a terminal in `pos-for-sell/` and search:

```bash
# How many database tables have workspace_id?
grep -c "workspace_id" database/schema.sql

# How many RLS policies use is_workspace_member?
grep -c "is_workspace_member" database/rls-policies.sql

# How many Postgres functions check is_workspace_member?
grep -l "is_workspace_member" database/functions/*.sql
```

You should see workspace_id in many places, and `is_workspace_member` enforcement throughout. **That density is the whole point** — every layer reinforces the rule.

### Roles in MochiPOS

| Role | Can do |
|---|---|
| `owner` | All workspace operations including delete |
| `manager` | All except delete workspace; can invite staff |
| `cashier` | Sell, view today's sales |
| `stock_staff` | Adjust stock, no sales |
| `viewer` | Read-only dashboard |

For pilot, every workspace starts with one `owner` and that's it. Other roles are reserved for after pilot.

### Audit logs — the manager's notebook

Open `database/functions/create_registration_token.sql`, lines 55-61. Every important RPC ends with an `insert into audit_logs(...)`. This means:

- Who did it (`user_id`)
- For which tenant (`workspace_id`)
- What action (`'create_registration_token'`)
- What changed (`new_value` jsonb snapshot)
- When (`created_at` automatic)

Even the platform founder cannot pretend an action didn't happen. Audit logs are append-only.

### Common confusion

- *"What if a user belongs to two workspaces?"* — `workspace_members` allows it (composite unique on `workspace_id, user_id`), but the pilot starts with single-workspace users. Multi-workspace UX is post-pilot work.
- *"What stops a buggy frontend from sending `workspace_id: 'someone_else'`?"* — RLS. The database checks `auth.uid()` against the policy. If the user isn't a member of that workspace, the row is invisible/unwriteable. App code cannot lie about identity.
- *"How does RLS know who's calling?"* — Every Supabase request includes a JWT (signed token from Auth). The database extracts `auth.uid()` from that JWT. The token is signed by Supabase's secret — the user can't fake it.

### Exercise — see tenant isolation in action (30 min)

This requires Level 4 to be done (Supabase provisioned + at least one auth user).

1. **Read the layout's auth gate.** Open `src/app/app/layout.tsx`. Read lines 13-52 — the `checkClient()` function. Trace:
   - Where does it check if the user is logged in?
   - Where does it find the user's workspace?
   - What happens if there's no Supabase configured? (Hint: line 17.)
   - What happens if the user has no workspace? (Hint: line 34.)
2. **Find every workspace_id in app code.** In your editor, search for `workspace_id` across `src/`. Notice it appears in queries, not just in types. **Every read or write that touches a business table mentions `workspace_id` somewhere.**
3. **Try to leak data (a controlled experiment).**
   - In Supabase SQL Editor, run as `authenticated` (use "Run as user" if available), pretending to be a member of workspace A:
     ```sql
     select id, brand_name from workspaces;
     ```
     You'll see only your own workspace, not others. **RLS at work.**
   - Now try as the service role (the bypass key):
     ```sql
     select id, brand_name from workspaces;
     ```
     You see all workspaces. **That's why service role key MUST stay server-only.**
4. **Read the create_order safety check.** Open `database/functions/create_order.sql` lines 47-54. Trace what would happen if a cashier from workspace A submitted an order with `workspace_id: 'workspace_b'` in the payload:
   - Line 51 calls `is_workspace_member`.
   - Since the cashier is not a member of workspace B, line 52 raises `'create_order: forbidden'`.
   - Nothing inserts. **Multi-tenant safety enforced inside the database.**

### You graduate Level 5 when

You can answer:
- What is a "tenant" in MochiPOS?
- Which column on a business table identifies its tenant?
- What are the three layers of tenant defense (schema, RLS, RPC)?
- Why must `SUPABASE_SERVICE_ROLE_KEY` never appear in frontend code?
- What's the difference between auth (authentication) and authz (authorization)?
- If a cashier tries to void another workspace's order, what stops them at three different layers?

---

## Bonus — Mini project: add one small feature to Product Setup

Once Levels 1–5 are done, the natural next step is *building* something real. The roadmap suggests "Product Setup module" as the first practice project. MochiPOS already *has* this page (`src/app/app/setup/products/`). So your mini project is to **add one small feature to the existing page**.

### Suggested mini features (pick one)

| Feature | Approx difficulty | Why it teaches |
|---|---|---|
| "Duplicate product" button on each row | Small | Practice React events, optimistic UI updates |
| Sort toggle (alphabetical / by price / by stock) | Small | Practice client-side state, derived data |
| Inline price edit (click price → edit → save) | Medium | Practice forms inside lists, server action call |
| "Mark as inactive" (soft delete) | Medium | Practice schema changes, migrations, RLS policy update |
| Filter by category | Small | Practice URL search params, server vs client filter |

### How to start

1. Open `src/app/app/setup/products/CatalogManager.tsx` and read it (~200 lines).
2. Decide which feature you want.
3. Write a 5-line plan as a TASKS.md entry: *what, where, acceptance, risk*.
4. Make a branch: `git checkout -b learning/duplicate-product-button` (or whatever you picked).
5. Implement. Ask the AI to help, but YOU should be able to read every line of what it writes.
6. PR + merge as in Level 4.

### Done means

- The new feature works in demo mode (without Supabase).
- The new feature works in real mode (with Supabase) — no broken queries, no leaked tenant data.
- You can explain to the AI agent in two sentences what you changed and why.

That's the moment you've made the round trip from "I don't understand the repo" to "I just shipped a feature." After that, every future learning is just iteration on this loop.

---

## Cheat sheet — commands you'll use most

```bash
# In pos-for-sell/

npm run dev          # start the dev server on http://localhost:3000
npm test             # run the vitest test suite
npm run build        # production build (catches TS errors)

# Git basics
git status                                       # what's changed
git checkout -b learning/my-thing                # new branch
git commit -am "message"                         # commit all tracked changes
git push -u origin learning/my-thing             # push to GitHub
gh pr create --title "..." --body "..."          # open PR
gh pr merge <num> --squash --delete-branch       # merge

# Search the codebase
# (use your editor's search; ripgrep / VSCode search work great)
```

## Reading order — when you're lost

1. [LEARNING_REPO_MAP.md](LEARNING_REPO_MAP.md) — "where does X live?"
2. [LEARNING_GLOSSARY.md](LEARNING_GLOSSARY.md) — "what does this term mean?"
3. [LEARNING_ERRORS.md](LEARNING_ERRORS.md) — "the dev server says X, what does that mean?"
4. [LEARNING_FLOWS.md](LEARNING_FLOWS.md) — "what happens when the user clicks X?"
5. [LEARNING_AI_WORKFLOW.md](LEARNING_AI_WORKFLOW.md) — "how do I work with AI on this without breaking things?"
6. [LEARNING_TYPESCRIPT.md](LEARNING_TYPESCRIPT.md) — "what does this `: string | null` mean?"
7. [ROADMAP.md](ROADMAP.md) — "where is the project headed?"
8. [PROJECT_VISION.md](PROJECT_VISION.md) — "who is the pilot for?"
9. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — "what tables exist?"
10. [USER_FLOW.md](USER_FLOW.md) — "what does a sale look like end-to-end?"

---

## Scavenger hunt — repo navigation drill (~20 min, optional)

Before or after Level 2, do this to build navigation muscle. For each item, find it in the repo and answer the question. No cheating — actually open the file.

| # | Find this | Question |
|---|---|---|
| 1 | The file that becomes the URL `/apply` | What's its absolute path under `src/`? |
| 2 | The Server Action that handles application submission | Which file? Which line declares `"use server"`? |
| 3 | The Postgres function that creates a sale atomically | Where does it lock the event row? (Hint: look for `for update`) |
| 4 | The RLS policy for the `products` table | What does the SELECT policy require? |
| 5 | The TypeScript type for one row of `products` | What types does it use for money columns? |
| 6 | The auth gate that wraps every `/app/*` URL | Which mode does it return when Supabase env vars are missing? |
| 7 | The Supabase client used in Server Components | Why is there a separate "admin" client? |
| 8 | The cart store (where cart state lives) | What kind of state container does it use? |
| 9 | The customer-portal claim RPC | Why is it `security definer` and grant-able to `anon`? |
| 10 | One vitest test file | What's the convention for test file naming? |

When you can answer all 10 in under 10 minutes by opening files in your editor, you've internalized the repo layout. That's a real milestone.
