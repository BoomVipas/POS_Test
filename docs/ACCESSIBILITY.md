# Accessibility

## Goals

The booth POS will be used in less-than-ideal conditions: low light, gloved hands, glare, distraction, multi-language staff. Accessibility helps everyone — not just users with permanent disabilities.

## Done

- **Form labels**: every `<input>`, `<textarea>`, `<select>` has an associated `<label>` (via `htmlFor` / `useId`).
- **Error messaging**: form errors render with `aria-invalid` and `aria-describedby` pointing at the message.
- **Focus management**: `Modal` traps focus, restores focus on close, locks body scroll, closes on Escape.
- **Toast notifications**: `<div aria-live="polite" aria-atomic="true">` so updates are announced.
- **Reduced motion**: global `@media (prefers-reduced-motion)` override neutralises animations + transitions.
- **Touch targets**: minimum 36px buttons in POS workflow; primary CTAs ≥44px.
- **Color contrast**: meowmeow palette tested at WCAG AA — `text-text` (#2b231d) on `bg-panel` (#fffaf3) is 11.6:1.
- **Light mode only**: dark mode is intentionally not implemented; booth lighting unreliable.
- **Keyboard escape**: every modal closeable via Escape.
- **Tabular numerics** on prices/totals so 1,234 lines up with 12.
- **Language attribute on `<html>`**: `src/app/layout.tsx` reads the active language via `getLang()` and sets `<html lang={lang}>` so screen readers announce content in the right language (shipped with Wave 19 i18n).

## Pending (post-pilot)

- Keyboard navigation for product grid (arrow keys to move card focus).
- Screen-reader pass on POS and dashboard.
- High-contrast theme variant.
- Captioning for any future audio/video.

## Tools we use

- Manual: keyboard navigation, screen reader (VoiceOver / NVDA spot checks).
- Build-time: `eslint-plugin-jsx-a11y` (next.js default ESLint config covers this).
- Runtime: prefer real `<button>` / `<a>` / `<select>` over divs with `onClick`.
