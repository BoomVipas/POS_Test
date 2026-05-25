# MochiPOS — team board

The live "who's on what" board for the team. Zero setup — it's just this file.
(A GitHub Projects kanban is an optional one-command upgrade — see the bottom.)

**How to use it**
- **Grab work:** move its row to **🔵 In progress**, put your name + branch/PR, and
  assign yourself on the linked GitHub issue.
- **Detail + discussion** live on the GitHub **issue**; this board is just the
  at-a-glance "who/what/where".
- **When your PR merges:** move the row to **✅ Recently shipped** (or drop it —
  `docs/STATUS.md` is the full record).
- **Before you start:** `git checkout main && git pull` (see `docs/TEAM_WORKFLOW.md`).
- **One person per branch.** Ping the other dev for a look on risky changes
  (auth · RLS · money · inventory · migrations).

---

## 🔵 In progress
| Item | Who | Branch / PR |
|---|---|---|
| _(nothing claimed — grab something from Ready)_ | | |

## 🟢 Ready to grab
Curated starter work. Pick one, assign yourself on the issue, move it to In progress.

| Issue | Item | Arc |
|---|---|---|
| [#15](https://github.com/visanchan/mochipos/issues/15) | Real receipt on the POS success page | pos-polish |
| [#16](https://github.com/visanchan/mochipos/issues/16) | Product images → Supabase Storage | pos-polish |
| [#17](https://github.com/visanchan/mochipos/issues/17) | Per-event stock edit (restock mid-event) | pos-polish |
| [#18](https://github.com/visanchan/mochipos/issues/18) | Lint baseline → 0 warnings | dx |
| [#19](https://github.com/visanchan/mochipos/issues/19) | `redeem_invite_code` dead-code cleanup *(needs migration)* | dx |

## 🗺️ Arcs (the bigger picture)
- **admin-invite** — [#20](https://github.com/visanchan/mochipos/issues/20): approve application → issue real invite code → email (DD-23–32). **Next big arc; not started.** Split into sub-issues when someone picks it up.
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

_(Earlier: DD-39 login · DD-41 session/sign-out · DD-42 RLS test · DD-33–38 register · DD-40 reset · DD-43–53 products · Wave 43 events — see STATUS.md.)_

---

## Optional: upgrade to a GitHub Projects kanban (~20s)
A real kanban auto-tracks issues + PRs + assignees + status — no manual moves. To enable it, run once (opens a browser to authorize):
```
gh auth refresh -s project
```
…then tell Claude, and it'll build + configure the board (columns, all issues, group-by-arc) and keep it current. This file then becomes a mirror/backup.
