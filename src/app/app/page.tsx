import Link from "next/link";
import { getDict } from "@/lib/i18n/server";

export default async function AppHomePage() {
  const { t } = await getDict();
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-accent-strong">
        {t.appHome.title}
      </h1>
      <p className="mt-3 text-text/85">{t.appHome.subtitle}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <Tile
          href="/app/pos"
          title={t.appHome.tilePosTitle}
          body={t.appHome.tilePosBody}
        />
        <Tile
          href="/app/setup/products"
          title={t.appHome.tileProductsTitle}
          body={t.appHome.tileProductsBody}
        />
        <Tile
          href="/app/dashboard"
          title={t.appHome.tileDashboardTitle}
          body={t.appHome.tileDashboardBody}
        />
        <Tile
          href="/app/send-later"
          title={t.appHome.tileSendLaterTitle}
          body={t.appHome.tileSendLaterBody}
        />
        <Tile
          href="/app/correction"
          title={t.appHome.tileCorrectionsTitle}
          body={t.appHome.tileCorrectionsBody}
        />
        <Tile
          href="/app/audit-log"
          title={t.appHome.tileAuditLogTitle}
          body={t.appHome.tileAuditLogBody}
        />
        <Tile
          href="/app/close-day"
          title="Close day"
          body="Reconcile counted cash against today's sales."
        />
        <Tile
          href="/app/stock-count"
          title="Stock count"
          body="Walk the warehouse, count, fix drift after each event."
        />
        <Tile
          href="/app/inventory/samples"
          title="Sample bucket"
          body="Move stock between event-sellable and on-display sample. Sell a sample, return one to event."
        />
        <Tile
          href="/app/customers"
          title="Customers"
          body="Lifecycle, lifetime spend, top SKU per phone."
        />
        <Tile
          href="/app/pre-orders"
          title={t.preOrders.title}
          body={t.preOrders.body}
        />
        <Tile
          href="/app/settings"
          title={t.appHome.tileSettingsTitle}
          body={t.appHome.tileSettingsBody}
        />
      </ul>
    </main>
  );
}

function Tile({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group block h-full rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4 shadow-rest transition duration-150 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-lift active:translate-y-0 active:shadow-rest"
      >
        <p className="font-display text-xl text-accent-strong">{title}</p>
        <p className="mt-1 text-sm text-text/80">{body}</p>
      </Link>
    </li>
  );
}
