# UI history

A versioned visual archive of meaningful UI changes, so we can review how the app looks over time without re-running anything.

## How it's organized
- One **dated milestone folder** per significant UI change set: `YYYY-MM-DD-<slug>/`.
- Each folder holds full-page screenshots + a `README.md` index mapping each file to the screen, what changed, and the PR.

## How to regenerate
Captured against **demo mode** (no Supabase, no login) with a throwaway Playwright spec, deleted after the run:
1. Add a temp spec under `tests/e2e/` that navigates the `/app/*` routes and calls `page.screenshot({ path: "docs/ui-history/<milestone>/<n>-<name>.png", fullPage: true })`.
2. `npx playwright test tests/e2e/<spec>` (the config auto-starts `npm run dev`).
3. Delete the temp spec; commit the PNGs + an index `README.md`.

## Milestones
- [2026-05-22 — Mochi UI pass](./2026-05-22-mochi-ui/) — PR #84 (ConfirmDialog / UX polish), #85 (beauty pass + cleanup), #83 (event-setup screen).
