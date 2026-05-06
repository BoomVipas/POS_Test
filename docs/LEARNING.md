# Founder Learning Path — MochiPOS

> Started 2026-05-07. Source: [ROADMAP.md § 13](ROADMAP.md). Goal: founder can read the MochiPOS repo, guide AI agents, review work, and make architectural calls — not become a full-time engineer.

## Method

- One level at a time. No skipping ahead.
- Every concept anchors to a real MochiPOS file or service.
- Every concept anchors to a booth / family-business analogy.
- Each level ends with one hands-on exercise (5–15 min) inside the actual repo.
- Update this file after each level is done.

## Progress

- [ ] **Level 1 — Web app basics** (taught 2026-05-07; exercise pending)
- [ ] Level 2 — Next.js structure
- [ ] Level 3 — Supabase basics
- [ ] Level 4 — Deployment flow
- [ ] Level 5 — SaaS architecture

## Resume here (next session)

**Where we left off:** Level 1 was taught in chat on 2026-05-07. Founder paused before doing the DevTools exercise, planning to resume the next day.

**Next session opening move:**
1. Ask: "Did you run `npm run dev` and look at the Network tab? What did you see?"
2. If yes — debrief what they saw, fill any gaps, then move to Level 2 (Next.js structure: how `src/app/...` folders become real URLs; server vs client components; Server Actions; env vars).
3. If they didn't get to it — walk them through it live, screen by screen.

**Don't:** dump Level 2 before confirming Level 1 landed.

---

## Level 1 — Web app basics

**The 5 concepts in plain language, mapped to MochiPOS:**

| Concept | What it means | In MochiPOS | Booth analogy |
|---|---|---|---|
| **Frontend** | The screen the user looks at and clicks. Runs in the browser/tablet. | `/app/pos`, `/register/[token]`, all the React components in `src/app/...` | The cashier — visible, fast, friendly. |
| **Backend** | Code that runs on a server, never on the user's device. Does things the browser can't be trusted with: talk to the DB, send emails, decrement stock atomically, validate payment. | The Postgres functions (`create_order`, `claim_registration_token`), Next.js Server Actions (`actions.ts` files) | The manager in the back room — verifies, signs, files the receipt. |
| **Database** | Long-term memory. Survives when the page closes or the server restarts. | Supabase Postgres tables: `products`, `orders`, `event_inventory`, `customers`, `pets` | The locked file cabinet — every receipt, every count, every customer record. |
| **Hosting** | Where the app actually lives so anyone on the internet can reach it. | **Vercel** (the Next.js app) + **Supabase** (the database/auth/storage) | The warehouse — the physical place where the cashier, the manager, and the file cabinet all live. |
| **API** | The language the frontend uses to ask the backend to do something. "Give me the product list." "Save this order." | Next.js Server Actions + a few direct Supabase queries | The intercom between the cashier and the manager. |

**The big picture (one diagram):**

```
Cashier's tablet (frontend, in browser)
        ↓ API call
Vercel server (Next.js Server Actions = backend)
        ↓
Supabase Postgres (database)
        ↓
Resend (email — also backend)
```

**Key insight:** Frontend can be tampered with — it lives on the user's device. Backend cannot — it lives on a server you control. **Anything that affects money, stock, or trust must run on the backend.** That's why MochiPOS does sales through `create_order` (a Postgres function on the backend), not through JavaScript in the browser.

### Exercise — see the conversation yourself (10 min)

1. Open Terminal in `pos-for-sell/` folder.
2. Run: `npm run dev`
3. Wait for `Ready in X.Xs` and a localhost URL.
4. Open the URL in your browser (usually `http://localhost:3000`).
5. Press **F12** to open DevTools. Click the **Network** tab.
6. In DevTools, click the small "trash can" icon to clear the list.
7. Now click around the app: visit `/apply`, then `/app`, then `/app/pos`.
8. Watch the rows that appear — each row IS one message between frontend (browser) and backend (server).
9. Click any row. You'll see two panels: **Headers** (the request the browser sent) and **Response** (what the server sent back).

**Success criteria:** You can answer:
- Which row is the request for the actual page (HTML)?
- Which rows are for images, fonts, CSS?
- When you submit the /apply form, can you find the row that shows the form data going to the server?

When you've done this, tell me what you saw, and we'll go to Level 2.

---

## Level 2 — Next.js structure (locked until Level 1 complete)

Topics that will be covered:
- App Router (`src/app/...` folder structure)
- Pages vs layouts vs components
- Server components vs client components (the `"use client"` line)
- Server Actions
- Environment variables (`.env.local`, `process.env.X`)

---

## Level 3 — Supabase basics (locked)

Topics: tables, rows, columns, foreign keys, RLS, auth, storage buckets.

---

## Level 4 — Deployment flow (locked)

Topics: GitHub branch → PR → Vercel preview → merge → production deploy. Env vars per environment.

---

## Level 5 — SaaS architecture (locked)

Topics: tenant (`workspace_id` / `business_id`), roles, isolation, RLS in practice, audit logs, admin gates.
