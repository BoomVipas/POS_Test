# UI Kit · POS Register

Booth-side iPad register for MochiPOS. Mirrors the legacy Meowmeow POS structure
(Topbar / Sidebar / Toolbar / MenuGrid / Cart / ChargeModal) but in the Mochi
indigo+lavender brand language, with two SaaS additions:

- **Send Later** toggle in Cart (paid now, ship after event)
- **Lookup** action in Toolbar (find returning customer + pet by phone)
- **Pet QR notice** in ChargeModal (receipt prints a QR for post-purchase pet registration)

Components share scope via `window` exports. Tokens come from
`../../colors_and_type.css`. Product images come from `../../assets/products/`.
