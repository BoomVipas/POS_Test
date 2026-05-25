# Environment Variables

All env vars live in `pos-for-sell/.env.local` for local dev (git-ignored), and in Vercel Project Settings for deployed environments. `.env.example` ships a template.

## Required

| Var | Used by | Surface | Source |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/{client,server,admin,middleware}.ts` | browser + server | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | browser + server | same |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` | **server only** — never `NEXT_PUBLIC_*` | same |
| `RESEND_API_KEY` | `lib/email/resend.ts` | server only | https://resend.com/api-keys |
| `EMAIL_FROM` | `lib/email/resend.ts` | server only | a verified Resend domain (or `onboarding@resend.dev` for testing) |
| `ADMIN_EMAIL` | `app/apply/actions.ts` (notify-admin) | server only | the founder's inbox |

## Optional / future

| Var | When |
|---|---|
| `UPSTASH_REDIS_REST_URL` | DD-16 rate-limit |
| `UPSTASH_REDIS_REST_TOKEN` | same |
| `SENTRY_DSN` | DD-98 error tracking |
| `POSTHOG_KEY` | DD-21 analytics |

## Local setup

```bash
cd pos-for-sell
cp .env.example .env.local
# fill in the Supabase + Resend values
npm run dev
```

## Vercel deployment

In **Project Settings → Environment Variables** add the Required vars with **different values per environment**: **Production** → your production Supabase project; **Preview** → a separate **staging** project, so PR previews are DB-connected without touching pilot data (setup: [`STAGING_PREVIEWS.md`](STAGING_PREVIEWS.md)). `NEXT_PUBLIC_*` vars are exposed to the browser bundle by design; the rest are server-only. ⚠ Never cross the wires — production keys on Preview, or staging keys on Production, defeats the isolation.

## Validating

The code soft-fails when env vars are missing:
- `/admin/*` shows an "Admin offline" page if `NEXT_PUBLIC_SUPABASE_URL` is absent.
- `/apply` returns a friendly error from the server action.
- Mock fallbacks render in `/admin/{invite-codes,workspaces,audit-log}` and `/app/dashboard` so the UI is still usable in demo mode.

## Rotating

If you suspect a key is compromised:

1. In Supabase: `Settings → API → Reset service_role`. Update `.env.local` and Vercel.
2. In Resend: revoke the API key, create a new one. Update `.env.local` and Vercel.
3. Redeploy.

`anon` key rotation is supported by Supabase but rarely needed.
