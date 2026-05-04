# Performance

## Why it matters

Booth POS runs on tablets over 4G. A slow tap-to-add or slow checkout costs sales. The targets below are conservative — meowmeow's localStorage version was instant; a real-DB version must be **almost** as fast.

## Targets

| Metric | Target | Measured against |
|---|---|---|
| Time to add product to cart | <100ms | tap → cart line appears |
| Time to confirm sale | <800ms | confirm tap → success page |
| Initial page load (POS) | <2s on 4G | LCP |
| Bundle First Load JS, POS route | <250kB | next build report |
| End-of-day CSV export | <3s for 200 orders | server action duration |

## Build-time observability

`npm run build` reports per-route bundle size. Watch for any single page > 200kB First Load JS — investigate before merging.

## Run-time observability

- `instrumentation.ts` (DD-98) will wire Sentry / PostHog. Until then we have console logs.
- Vercel Analytics provides RUM (Real User Metrics) at the route level — enable in project settings.
- Supabase logs slow queries automatically.

## Common pitfalls

- **N+1 queries**. The dashboard tiles each query separately; in DD-85+ wire them through a single `dashboard_metrics(workspace_id, day)` RPC that returns one JSON blob.
- **Missing indexes**. `event_inventory(event_id, product_id)` is unique; `orders(workspace_id, event_id, created_at desc)` indexed in `schema.sql`. Add more as queries grow.
- **Image sizes**. Product images are compressed client-side (DD-46) to <250KB WebP before upload. Don't skip this.
- **Bundle bloat**. Avoid pulling whole UI libraries. Prefer composing primitives we own (`src/components/ui/*`).
- **Date parsing in tight loops**. `new Date(s)` is cheap; `Intl.DateTimeFormat` is not. Cache formatters at module scope (`new Intl.DateTimeFormat(...)` once, reuse).
- **JSON parsing on payment_records**. Pulled together with orders; not separately serialized.

## When to optimise

When users complain. Or when the metrics above slip. Don't pre-optimise — the meowmeow design proved that simple HTML beats clever bundling.

## Tooling on demand

- `next build` — bundle reports.
- `next dev --turbo` (default) — fast dev rebuilds.
- `chrome devtools → Performance` — for tap latency.
- Lighthouse — periodically; not on every PR.
- Bundle analyzer (`@next/bundle-analyzer`) — install on demand if a route balloons.
