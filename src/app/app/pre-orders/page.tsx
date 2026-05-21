import Link from "next/link";
import { getDict } from "@/lib/i18n/server";
import { PreOrderList } from "./PreOrderList";

export default async function PreOrdersPage() {
  const { t } = await getDict();
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong">
        {t.preOrders.title}
      </h1>
      <p className="mt-2 text-text/85">{t.preOrders.body}</p>
      <p className="mt-1 text-xs text-muted">{t.preOrders.demoNote}</p>

      <PreOrderList />

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← {t.chrome.appHome}
      </Link>
    </main>
  );
}
