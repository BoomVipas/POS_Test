# Google Auth setup (pilot sign-in) — Wave 49

This is the **founder/admin half** of invite-gated Google sign-in. The code is
done and merged; Google won't work until someone with dashboard access completes
the two config steps below. Until then, the "Continue with Google" buttons render
(in configured/prod mode) but Google will reject the request — **email + password
keeps working the whole time**, so this is non-blocking.

> **Who does this:** anyone with access to our Google Cloud project + the Supabase
> dashboard. ~15 minutes. No code change, no deploy.

---

## What it gives us

- **Pilot sellers sign in with Google** instead of remembering a password.
- Still **invite-only** (ROADMAP §14.4): a Google account that never redeemed an
  invite is bounced — Google can't become an open public signup.
- **Password stays** for the demo and as a fallback.

## How the redeem stays locked to the right person

An invite is issued to a **specific email** (`invite_codes.email`). With a
password, we create the account *as* that email, so they always match. With
Google, the seller arrives as whatever Gmail they picked — so the callback
**requires the Google email to equal the invited email** before it redeems the
invite (`src/lib/auth/invite-email.ts` → `inviteEmailMatches`). If they don't
match, we sign them out and show "doesn't match your invite."

➡️ **Action for whoever issues invites:** issue the invite to the **exact Gmail
address** the seller will click "Continue with Google" with. If their booth email
isn't a Google account, they use the password path instead.

---

## The redirect chain (why the two URLs below differ)

```
Browser  ──signInWithOAuth({redirectTo: https://APP/auth/callback?…})──▶  Supabase
Supabase ──sends browser to Google with redirect_uri = SUPABASE/auth/v1/callback─▶ Google
Google   ──user approves──▶  SUPABASE/auth/v1/callback   (← goes in Google Cloud)
Supabase ──redirects browser to──▶  https://APP/auth/callback?code=…   (← goes in Supabase allow-list)
APP      ──exchangeCodeForSession(code)──▶  session, then /app
```

So **Google Cloud** gets *Supabase's* callback; **Supabase** gets *our app's*
callback. Mixing these two up is the #1 setup mistake.

---

## Part A — Google Cloud Console (get a Client ID + Secret)

1. <https://console.cloud.google.com/> → pick (or create) the MochiPOS project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**.
   - App name: `MochiPOS` (or `Mochi POS`), support email, logo optional.
   - **Scopes:** the defaults (`email`, `profile`, `openid`) are all we need.
   - **Test users:** while the consent screen is in **Testing**, only listed
     emails can sign in — **add each pilot seller's Gmail here** (≤100). When the
     pilot grows, click **Publish app** to lift the test-user limit.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - Name: `MochiPOS web`.
   - **Authorized redirect URIs** → add **Supabase's** callback (Project ref is in
     Supabase → Project Settings → General):
     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```
   - Create → copy the **Client ID** and **Client Secret**.

## Part B — Supabase dashboard (enable the provider + allow-list our app)

1. **Authentication → Providers → Google** → toggle **Enable**.
   - Paste the **Client ID** and **Client Secret** from Part A → **Save**.
2. **Authentication → URL Configuration**
   - **Site URL:** our production origin, e.g. `https://app.mochipos.com`
     (use the real Vercel/production domain).
   - **Redirect URLs** (allow-list — add every origin we sign in from):
     ```
     https://<production-domain>/auth/callback
     http://localhost:3000/auth/callback
     https://<project>-*.vercel.app/auth/callback     ← preview deploys (wildcard)
     ```
   Supabase will only bounce the browser back to URLs that match this list, so a
   missing entry shows up as "redirect not allowed" after the Google screen.

That's it — no redeploy needed. The provider flips on live.

---

## Verify (do these once configured)

| Test | Expected |
|---|---|
| New invite to `you@gmail.com` → /register → **Continue with Google** as `you@gmail.com` | Lands in `/app` with a workspace |
| Same, but sign in as a **different** Gmail | Bounced to `/register`, "doesn't match your invite" |
| Existing seller → /login → **Continue with Google** | Lands in `/app` |
| A random Gmail with no invite → /login → **Continue with Google** | Bounced to `/login`, "isn't set up yet — redeem your invite" |

If a step fails at the Google screen with a redirect error → re-check Part B
Redirect URLs. If it fails *after* returning to our app → check the server logs
for `[auth/callback]` lines (the reason is logged there, not shown to the user).

---

## Where this lives in the code (for review)

- `src/app/auth/callback/route.ts` — the OAuth callback: exchanges the code, and
  for register **re-validates the invite + matches the Google email** before
  calling `redeem_invite_code`; for login **requires an existing workspace**.
- `src/lib/auth/invite-email.ts` — the pure email-match gate (unit-tested in
  `tests/lib/invite-email.test.ts`).
- `src/components/auth/GoogleButton.tsx` — the "Continue with Google" button
  (hidden in demo mode, i.e. when `NEXT_PUBLIC_SUPABASE_URL` is unset).
- Wired into `src/app/login/page.tsx` and `src/app/register/RegisterForm.tsx`.

No environment variables are added to the app — the Google Client ID/Secret live
**only in Supabase**, never in our repo or Vercel env.
