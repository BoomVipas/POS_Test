import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { safeNextPath } from "@/lib/auth/safe-next";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { LoginForm } from "./LoginForm";

// Auth runs per request (reads the session cookie), so this page can't be
// statically prerendered.
export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? null;
  const errorParam = sp.error ?? null;

  // Already signed in? Don't show a login form — send them on. The /app guard
  // deep-links here with ?next=<path>; honour it (sanitised against open
  // redirects) for everyone else who lands here.
  if (isConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect(safeNextPath(next));
  }

  const { t } = await getDict();

  // OAuth (Google) failures bounce back here with a short `?error=` reason. Only
  // the two login-side reasons are surfaced; anything else stays silent.
  const loginError =
    errorParam === "needs-invite"
      ? t.login.errorNeedsInvite
      : errorParam === "oauth"
        ? t.login.errorGoogleGeneric
        : null;
  const googleCallbackPath = `/auth/callback?next=${encodeURIComponent(
    safeNextPath(next),
  )}`;

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-5 py-16">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <Image
            src="/mochi-wordmark.png"
            alt="MochiPOS"
            width={132}
            height={30}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
        <h1 className="font-display text-3xl text-accent-strong">
          {t.login.title}
        </h1>
        <p className="mt-3 mb-6 text-text/85">{t.login.subtitle}</p>

        {loginError ? (
          <p
            role="alert"
            className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]"
          >
            {loginError}
          </p>
        ) : null}

        <LoginForm t={t.login} next={next} />

        <div className="mt-4">
          <GoogleButton
            label={t.login.googleCta}
            genericError={t.login.errorGoogleGeneric}
            dividerLabel={t.login.orDivider}
            path={googleCallbackPath}
          />
        </div>

        <div className="mt-6 space-y-2 text-center text-xs text-muted">
          <p>
            {t.login.invitedPrefix}{" "}
            <Link
              href="/register"
              className="font-bold text-accent hover:underline"
            >
              {t.login.registerCta}
            </Link>
          </p>
          <p>
            {t.login.newHerePrefix}{" "}
            <Link
              href="/apply"
              className="font-bold text-accent hover:underline"
            >
              {t.login.applyCta}
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-accent-strong hover:underline"
          >
            {t.login.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
