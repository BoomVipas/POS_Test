import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { safeNextPath } from "@/lib/auth/safe-next";
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
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? null;

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

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl text-accent-strong">
          {t.login.title}
        </h1>
        <p className="mt-3 mb-6 text-text/85">{t.login.subtitle}</p>

        <LoginForm t={t.login} next={next} />

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
