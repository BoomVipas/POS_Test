import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { RegisterForm } from "./RegisterForm";

// Reads the session cookie to bounce already-signed-in users, so it can't be
// statically prerendered.
export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function RegisterPage() {
  // A signed-in user has no business on the redeem page — send them to the app.
  if (isConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/app");
  }

  const { t } = await getDict();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl text-accent-strong">
          {t.register.title}
        </h1>
        <p className="mt-3 mb-6 text-text/85">{t.register.subtitle}</p>

        <RegisterForm t={t.register} />

        <div className="mt-6 text-center text-xs text-muted">
          <p>
            {t.register.haveAccount}{" "}
            <Link
              href="/login"
              className="font-bold text-accent hover:underline"
            >
              {t.register.signInCta}
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-accent-strong hover:underline"
          >
            {t.register.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
