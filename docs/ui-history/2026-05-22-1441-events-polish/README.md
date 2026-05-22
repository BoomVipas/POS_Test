# Event-setup screen polish (F1) — 2026-05-22 14:41

## Business meaning
Brings the booth **event-setup screen** (`/app/events`) fully in line with the merged Mochi polish, so the founder's planning/setup UI feels as finished as the rest of the pilot POS. The screen was already largely on-brand (it was built recently with the same conventions); this pass closes the last **edge-state** gaps:

- A **branded loading shimmer** instead of bare "Loading…" — reads as "loading", not "broken".
- An **illustrated empty state** (lucide icon) when no products are allocated yet, pointing staff to Setup → Products.

Visual/UI-only. The event rules remain **demo/config** — they do **not** drive POS checkout yet (see `TASKS.md` F2/F3).

## Screenshots
| File | Screen | What it shows |
|---|---|---|
| `01-events.png` | Event setup | The full screen — already consistent (panels, `font-black` title, focus-ring inputs, Switch toggles). This pass only touched edge states, so the main view is unchanged. |
| `02-events-loading-skeleton.png` | Event setup (loading) | Branded `Skeleton` blocks replacing the bare "Loading…" text. |

_Regenerate per `../README.md`._
