# UI history

A versioned visual archive of meaningful UI changes, so the founder can review how the app looks over time without re-running anything.

**Workflow:** whenever a UI edit/implementation is ready for founder review, **capture screenshots into a new milestone folder here first** — review happens off these images, not by re-running the app.

## Naming
One milestone folder per change set, named **`YYYY-MM-DD-HHMM-<work-title>`** (date · time · short slug) so folders sort chronologically and are identifiable at a glance — e.g. `2026-05-22-1358-mochi-ui-pass`.

## Folder contents
- Full-page screenshots, numbered `01-…`, `02-…` in viewing order.
- A `README.md` index that **leads with a `## Business meaning` section** — what the change does *for the business* (booth sellers / pilot / owner), in plain language — **before** the technical screenshot captions (file → screen → what changed → PR).

## How to regenerate
Captured against **demo mode** (no Supabase, no login) with a throwaway Playwright spec:
1. Add a temp spec under `tests/e2e/` that navigates the `/app/*` routes and calls `page.screenshot({ path: "docs/ui-history/<milestone>/<n>-<name>.png", fullPage: true })`.
2. Run it via the **PowerShell** tool: `npx playwright test tests/e2e/<spec>` (the config auto-starts `npm run dev`).
3. Delete the temp spec; commit the PNGs + the index `README.md`.

## Milestones
- [2026-05-22 13:58 — Mochi UI pass](./2026-05-22-1358-mochi-ui-pass/) — PR #84 (ConfirmDialog / UX polish), #85 (beauty pass + cleanup), #83 (event-setup screen).
