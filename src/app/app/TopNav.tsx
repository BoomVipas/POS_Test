"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Top-bar nav for the app shell. Client component so it can highlight the
 * active route (the Mochi mockup's indigo nav pill — screens/dashboard.html
 * `.nav a.on`). Labels are resolved server-side (i18n) and passed in.
 */
export function TopNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {items.map((it) => {
        const active =
          pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-[10px] px-3.5 py-2 text-[13px] font-bold text-accent"
                : "rounded-[10px] px-3.5 py-2 text-[13px] font-bold text-muted transition-colors hover:text-text"
            }
            style={active ? { background: "var(--indigo-50)" } : undefined}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
