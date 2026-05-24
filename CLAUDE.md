# Claude — Execution Protocol (MochiPOS / pos-for-sell)

This is the **MochiPOS** Cat Booth POS SaaS — a **standalone repo** (`visanchan/mochipos`). It was extracted in May 2026 from the `meowmeow_sandbox` monorepo, where it began as the `pos-for-sell/` folder beside the single-file **MeowMeow Event POS** (`meowmeow_pos_event.html`). It keeps its own protocol, batch namespace (`DD-XX` / `Wave NN`), and architecture. (The npm package name is still `pos-for-sell` until a later rename batch.)

## Working with this user

The user is a **builder / founder-developer**, not a full-time professional programmer. Read this before adopting a tone:

- **Role**: product owner + business founder + AI-assisted developer (MeowMeow Event POS — production internal use; MochiPOS — SaaS in active build).
- **Domain expertise**: deep, real, hard-won. Pet Expo Thailand booth. Family business operations. Stock movement, sample handling, Send Later orders, free-gift promos, customer behaviour at peak hours, post-event reconciliation. They will catch product / UX issues that pure-tech reviewers miss.
- **Toolchain**: ChatGPT, Codex, Claude (this), GitHub, Vercel, Supabase, VS Code.
- **What to assume they can do**: code structure, repo work, prompt engineering, deploy, PR review, product decisions, workflow logic from real-world experience, real-business testing.

**Communication style** — *technical enough for building, but always connected to business workflow and real user behavior:*

- Skip syntax / boilerplate explanations.
- Connect architectural choices to operational reality (cashier speed, queue impact, customer experience, drift risk in a real event).
- Their broken-English messages are normal — "warehouse inventory is mess" is a precise field finding, not hand-waving. Translate to specifics, propose concrete actions, ask one targeted question at a time when genuinely ambiguous.
- "do whatever you want" / "run end to end" / "do it now" is an autonomous-mode trigger — execute end-to-end without mid-run confirmation pauses; surface only real blockers.

## Read first, every session

1. [docs/ROADMAP.md](docs/ROADMAP.md) — **canonical** strategic direction (May 2026): beachhead market, vertical-module strategy, Google Auth + invite-only pilot, three-level data philosophy, six-month plan, pricing intent. Wins over older planning docs where they overlap.
2. [docs/PROJECT_VISION.md](docs/PROJECT_VISION.md) — pilot-mechanics overview: hard requirements, non-goals, success criteria. Read after ROADMAP for the operational layer.
3. [docs/BATCH_PLAN.md](docs/BATCH_PLAN.md) — all ~100 planned batches in order, by phase.
4. [TASKS.md](TASKS.md) — live status board (which batch is claimed/in-progress/done).
5. [docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) — Mochi indigo/lavender design system.
6. [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — table list and RLS approach.

## Stack (do not change without batch)

- Next.js 16 (App Router, src dir)
- React 19, TypeScript 5
- Tailwind CSS 4
- Supabase (Postgres, Auth, Storage, RLS)
- Resend (transactional email)
- Vercel (hosting)
- npm (package manager)

## Sister project — MeowMeow Event POS (separate repo)

Several SaaS features port field-proven patterns from the **MeowMeow Event POS**, the single-file booth app these patterns were validated in. It now lives in a **separate repo** (`visanchan/meowmeow_sandbox`, file `meowmeow_pos_event.html`) — **not** in this tree. When implementing a wave that names a meowmeow analog — sample bucket (Wave 39a/b ↔ meowmeow Batch DD), Send Later (Wave 16/17), free-gift promo, bill correction, void audit — consult that repo to understand *why* the pattern works under real booth conditions:

- `readme.md` (in that repo) — meowmeow product direction + behavior rules (Send Later, Inventory, Correction Center, Free Gift Rules).
- `TASKS.md` (in that repo) — meowmeow batch history; the Done section names which batch shipped each pattern (e.g. Batch DD = sample bucket, Batch EE = bill-correction allowance).
- `meowmeow_pos_event.html` (in that repo) — the source app itself; grep it for the feature name.

Treat meowmeow as a source of validated patterns, **not** a target for edits. It has its own protocol and batch naming (`batch/<letter>`), distinct from this project's `DD-XX` / `Wave NN`. The two repos are independent now — don't assume relative paths between them.

## Hard rules

1. **No localStorage for business data.** All orders, products, payments, inventory go to Supabase. localStorage is only allowed for ephemeral UI state (selected day, expanded panels, draft cart that has not been confirmed).
2. **Every business table has `workspace_id`.** Every query and every RLS policy filters by it. Never write a SELECT/UPDATE/DELETE on a business table without a workspace filter.
3. **RLS is on for every business table.** Even server-side queries use the user's session token, not the service role, unless an admin route explicitly opts in.
4. **Service role key is server-only.** Never imported by anything in `src/app/` that renders on the client. Lives in `src/lib/supabase/admin.ts` and is used only inside Server Actions / Route Handlers / admin pages.
5. **Money is integers, in the smallest unit (THB satang).** No floats for prices, totals, fees.
6. **Orders are written through a Postgres function** that updates `orders`, `order_items`, `payment_records`, and `event_inventory` in one transaction. The client never decrements stock directly.
7. **Audit log on every admin/correction/refund action.** `audit_logs` row written in the same transaction as the change.
8. **Email goes through `lib/email/resend.ts`.** No direct fetch to Resend in components.
9. **Visual language follows Mochi.** Unified indigo/lavender brand across the whole app, generous radii, tabular numerics. See `docs/DESIGN_TOKENS.md` and the `mochipos-design` skill.

## Batch flow

Two naming conventions are in use — pick based on which kind of work you're starting:

- **DD-XX** (DD-01 through DD-100, plus DD-101..210 in `BATCH_PLAN_VOL2.md`) — the original upfront-planned batches from the 100-batch plan.
  - Branch: `pos/DD-XX-short-slug` (the `pos/` prefix keeps SaaS branches visually distinct from `batch/...` branches that target `meowmeow_pos_event.html`).
  - Commit prefix: `[DD-XX] one-line summary`.
  - PR title: `pos: DD-XX <one-line summary>`.
- **Wave NN** (post-DD-100 organic work) — feature-cohesive multi-batch work driven by competitor research, meowmeow field findings, and the strategic correction captured in [`docs/ROADMAP.md`](docs/ROADMAP.md) (the canonical strategy doc). Used for everything from Wave 12 onwards.
  - Branch: `pos/wave-NN-short-slug` (or `pos/wave-NNa-...` when a wave is split).
  - Commit prefix: `[Wave NN] one-line summary` (or `[Wave NNa] ...`).
  - PR title: includes Wave NN.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) "DD-XX vs Wave NN naming" for the convention details and [`docs/BATCH_PLAN.md`](docs/BATCH_PLAN.md) "Post-DD-100 Waves" section for the full shipped list.

Common rules for both conventions:

- **One implementation batch at a time.** Finish or hand off before claiming another.
- **Update [TASKS.md](TASKS.md) before editing.** Set `Owner: claude`, `Status: in-progress`, `Branch: ...`, `Claimed: <YYYY-MM-DD HH:MM>`.

## Working rules

- Server components by default. `"use client"` only when interactivity requires it.
- Forms use Server Actions, not bespoke API routes, unless there's a reason (webhooks, third-party callbacks, signed URLs).
- All public-facing forms must be rate-limited (Supabase Edge function or app-level check).
- All admin pages live under `/admin/...` and are gated by an admin-role check in middleware.
- Multi-tenant data must always render via the user's session — never via the service role on a client-facing page.
- Tests live under `pos-for-sell/tests/`. Smoke first, unit later.
- README is updated as part of any batch that changes externally-visible behavior.
- Do not edit files outside `pos-for-sell/` from within this project's batches, except to add a pointer in the root README.

## Handoff back to Codex/user

At the end of a batch, report:

- What changed (files + behavior).
- Migrations or env additions required.
- Manual checks performed.
- Any risk or assumption still open.
- Whether docs/TASKS were updated.

For high-risk batches (anything touching auth, RLS, payments, money totals, inventory atomicity, refunds, or email sending), request review before merge.

## When in doubt

- If the implementation reveals a bigger structural issue, stop and add a new batch instead of expanding scope.
- If a stale claim sits >24h with no branch activity, mark `Status: stale` and reassign with confirmation.
- Merge conflicts: never auto-resolve heuristically. Surface and recommend.

## Author note

The initial 100-batch plan in `docs/BATCH_PLAN.md` was drafted by Claude in solo mode at the user's explicit request to plan and execute end-to-end. Codex review of phase boundaries (especially Phase 4 → Phase 5 → Phase 6 inventory atomicity) is welcome before those phases begin implementation.
