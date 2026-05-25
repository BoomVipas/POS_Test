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

## Issues (static mirror — live status lives on the kanban)
| Issue | Item | Arc |
|---|---|---|
| [#15](https://github.com/visanchan/mochipos/issues/15) | Real receipt on the POS success page | pos-polish |
| [#16](https://github.com/visanchan/mochipos/issues/16) | Product images → Supabase Storage | pos-polish |
| [#17](https://github.com/visanchan/mochipos/issues/17) | Per-event stock edit (restock mid-event) | pos-polish |
| [#18](https://github.com/visanchan/mochipos/issues/18) | Lint baseline → 0 warnings | dx |
| [#19](https://github.com/visanchan/mochipos/issues/19) | `redeem_invite_code` dead-code cleanup *(needs migration)* | dx |
| [#20](https://github.com/visanchan/mochipos/issues/20) | **Arc:** admin-invite onboarding (DD-23–32) | admin-invite *(next big arc)* |

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

## ⚙ Optional kanban automations (~30s, in the project UI)
The "added → Todo" default already works. For full auto-tracking, open the
project → **⋯ → Workflows** and enable:
- **Auto-add to project** — new issues/PRs in `visanchan/mochipos` appear automatically.
- **Item closed → Done** (and/or **Pull request merged → Done**) — cards move themselves.
