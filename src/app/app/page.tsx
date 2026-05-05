import Link from "next/link";

export default function AppHomePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-4xl text-accent-strong">Open booth</h1>
      <p className="mt-3 text-text/85">Pick your next move.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <Tile
          href="/app/pos"
          title="POS"
          body="Sell at the booth right now."
        />
        <Tile
          href="/app/setup/products"
          title="Products"
          body="Set up SKUs, prices, images."
        />
        <Tile
          href="/app/dashboard"
          title="Dashboard"
          body="Today&rsquo;s sales and inventory."
        />
        <Tile
          href="/app/send-later"
          title="Send-later"
          body="Fulfil pending shipments."
        />
        <Tile
          href="/app/settings"
          title="Settings"
          body="Brand name, PromptPay phone, defaults."
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
        className="block rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4 hover:border-accent"
      >
        <p className="font-display text-xl text-accent-strong">{title}</p>
        <p className="mt-1 text-sm text-text/80">{body}</p>
      </Link>
    </li>
  );
}
