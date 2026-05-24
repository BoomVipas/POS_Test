import Link from "next/link";
import { getDict } from "@/lib/i18n/server";
import { ForgotForm } from "./ForgotForm";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const { t } = await getDict();
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl text-accent-strong">
          {t.passwordReset.forgotTitle}
        </h1>
        <p className="mt-3 mb-6 text-text/85">{t.passwordReset.forgotSubtitle}</p>

        <ForgotForm t={t.passwordReset} />

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
