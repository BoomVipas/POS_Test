import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { ResetForm } from "./ResetForm";

// Reads the recovery session that /auth/confirm established for this request.
export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function ResetPasswordPage() {
  const { t } = await getDict();

  // The recovery link routes through /auth/confirm, which exchanges the token
  // for a session before redirecting here. No session = the link was invalid,
  // already used, or expired.
  let hasSession = false;
  if (isConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSession = Boolean(user);
  }

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-5 py-16">
        {hasSession ? (
          <>
            <h1 className="font-display text-3xl text-accent-strong">
              {t.passwordReset.resetTitle}
            </h1>
            <p className="mt-3 mb-6 text-text/85">
              {t.passwordReset.resetSubtitle}
            </p>
            <ResetForm t={t.passwordReset} />
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl text-accent-strong">
              {t.passwordReset.expiredTitle}
            </h1>
            <p className="mt-3 mb-6 text-text/85">
              {t.passwordReset.expiredBody}
            </p>
            <Link
              href="/login/forgot"
              className="inline-block rounded-[14px] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-card)]"
              style={{ background: "var(--grad-primary)" }}
            >
              {t.passwordReset.requestNewCta}
            </Link>
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm font-bold text-accent-strong hover:underline"
          >
            {t.passwordReset.backToLogin}
          </Link>
        </div>
      </section>
    </main>
  );
}
