# MochiPOS — team board

**▶ Live board (kanban): https://github.com/users/visanchan/projects/1**

That GitHub Project is the source of truth for who's-on-what — cards = issues +
PRs, columns **Todo → In Progress → Done**, with assignees. This file is a quick
static mirror for anyone reading the repo.

**How to use the kanban**
- **Grab work:** open a card, **assign yourself**, drag it to **In Progress**.
- Put your branch/PR on the issue; when the PR merges, move the card to **Done**
  (or enable the auto-move workflow below).
- `git checkout main && git pull` before you start · **one person per branch** ·
  ping the other dev on risky changes (auth · RLS · money · inventory ·
  migrations). Full rules: [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md).

## What each card shows — the fields you monitor by

Every card carries the four things you watch, as real **fields** — so you can
group / sort / filter on them, not just read the title:

| Field | What | Values |
|---|---|---|
| **Batch** | which batch this card is | `DD-67`, `DD-45/46`, `Wave 44`… (blank = organic / hygiene work) |
| **Lane** | which *kind* of work | `backend` · `ui` · `qa` |
| **Arc** | which feature group | `pos-polish` · `admin-invite` · `dx` |
| **Assignees · Linked PRs · Status · Milestone** | who · which PR · column · stage | built-in |

> So a card reads at a glance: **Batch** DD-67 · **Who** visanchan · **Lane** ui ·
> **Arc** pos-polish · **PR** #26 · **Done**.

## Views (the tabs on the live board)

One project, several saved **views** — pick how you read it. Views are created in
the GitHub UI (the API can't); the click-by-click is in
[`docs/team-guide.html`](docs/team-guide.html) §4.

| View | Layout | Answers |
|---|---|---|
| **Master** | Table | everything at once — Batch · Who · Lane · Arc · PR · Status |
| **By person** | Board · columns = Assignees | who's on what right now |
| **By lane** | Board · columns = Lane (or Arc) | which *kind* of work |
| **By stage** | Board · columns = Milestone | where we are in the 6-month plan |
| **Status** *(default)* | Board · columns = Status | what's moving: Todo → In Progress → In Review → Done |

## Open issues (static mirror — live status + fields live on the kanban)

> Titles are kept **plain &amp; readable** — the technical code (`DD-XX` / `Wave NN`)
> lives in the **Batch** field, never in the title. Readable board, still filterable.

| Issue | Batch | Item | Lane | Arc |
|---|---|---|---|---|
| [#16](https://github.com/visanchan/mochipos/issues/16) | DD-45/46 | Upload and show product images | backend | pos-polish |
| [#17](https://github.com/visanchan/mochipos/issues/17) | — | Edit event stock during sales | backend | pos-polish |
| [#18](https://github.com/visanchan/mochipos/issues/18) | — | Clean up app warning messages | qa | dx |
| [#19](https://github.com/visanchan/mochipos/issues/19) | — | Clean up invite-code expiry logic *(needs migration)* | backend | dx |
| [#20](https://github.com/visanchan/mochipos/issues/20) | DD-23-32 | Admin approval creates seller invite codes | backend | admin-invite *(active arc)* |

## 🗺️ Arcs
- **admin-invite** — #20: approve application → issue real invite code → email. **In progress** — core (DD-26/27/28) on `pos/DD-26-approve-generate-invite` (claude, PR #23); remaining: resend/cancel invite (DD-30/31), search (DD-25).
- **pos-polish** — #15, #16, #17: finish the sale experience.
- **dx** — #18, #19: developer hygiene.
- Full plan: [`docs/BATCH_PLAN.md`](docs/BATCH_PLAN.md) · Direction: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## ✅ Recently shipped (2026-05-25)
The **post-Supabase arc — login → real atomic sale** — then live-debug fixes + team setup. Full history in [`docs/STATUS.md`](docs/STATUS.md) and [`TASKS.md`](TASKS.md) (Done).

| What | PR |
|---|---|
| Real POS sale: live catalog → `create_order` → atomicity | #9 |
| `seed.sql` idempotency fix + regression test | #11 |
| Team workflow docs + lint-in-CI + PR template | #12 |
| Per-user dev-workspace seeder | #13 |
| Auto-allocate new products into open events | #14 |
| In-repo board + GitHub Project | #21 |
| POS receipt shows real order details (DD-67) | #26 |

## ⚙ Optional kanban automations (~30s, in the project UI)
The "added → Todo" default already works. For full auto-tracking, open the
project → **⋯ → Workflows** and enable:
- **Auto-add to project** — new issues/PRs in `visanchan/mochipos` appear automatically.
- **Item closed → Done** (and/or **Pull request merged → Done**) — cards move themselves.
