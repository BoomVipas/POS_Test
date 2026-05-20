# Event POS — UI Kit

Recreation of `meowmeow_pos_event.html` — the iPad-landscape POS used at pet expos.

**Canvas:** 1366×1024 (iPad Pro 12.9", landscape).
**Layout:** Topbar 64px · Sidebar 84px · Menu grid (flex-1) · Cart drawer 360px.

## Files
- `index.html` — interactive demo: scan, add, charge, receipt
- `Topbar.jsx` — wordmark + day pills + sync status
- `Sidebar.jsx` — category rail (All / Sculpture / Painting / Modern / Stickers)
- `Toolbar.jsx` — search + scan affordance
- `MenuGrid.jsx` — product tiles
- `Tile.jsx` — single tile with stock pill
- `Cart.jsx` — drawer with rows + total + charge button
- `ChargeModal.jsx` — tender selection + receipt confirmation
- `Atoms.jsx` — Button, Pill, Field, Wordmark
