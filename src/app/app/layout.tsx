import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TopNav } from "./TopNav";

export const dynamic = "force-dynamic";

type AppGuard =
  | { mode: "configured"; workspaceName: string; userId: string }
  | { mode: "demo"; reason: string };

async function checkClient(): Promise<AppGuard | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { mode: "demo", reason: "Supabase not configured" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member) {
    return { mode: "demo", reason: "No workspace yet" };
  }

  const { data: ws } = await supabase
    .from("workspaces")
    .select("brand_name")
    .eq("id", member.workspace_id)
    .maybeSingle();

  if (!ws) {
    return { mode: "demo", reason: "Workspace missing" };
  }

  return {
    mode: "configured",
    workspaceName: ws.brand_name,
    userId: user.id,
  };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guard = await checkClient();
  if (guard === null) redirect("/login?next=/app");

  const { t } = await getDict();
  const headerName =
    guard.mode === "configured" ? guard.workspaceName : "Demo Brand";
  const initials =
    headerName
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  const navItems = [
    { href: "/app/pos", label: t.chrome.pos },
    { href: "/app/setup/products", label: t.chrome.products },
    { href: "/app/dashboard", label: t.chrome.dashboard },
    { href: "/app/send-later", label: t.chrome.sendLater },
    { href: "/app/correction", label: t.chrome.corrections },
    { href: "/app/audit-log", label: t.chrome.auditLog },
    { href: "/app/close-day", label: "Close day" },
    { href: "/app/pre-orders", label: t.preOrders.chromeLink },
    { href: "/app/settings", label: t.chrome.settings },
  ];

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-panel/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-2.5 sm:px-6">
          <Link href="/app" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/mochi-mascot.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
            <span className="font-display text-xl font-extrabold tracking-tight text-accent">
              Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
            </span>
          </Link>

          <TopNav items={navItems} />

          <div className="ml-auto flex items-center gap-2.5">
            {guard.mode === "demo" && (
              <span className="rounded-full border border-[var(--color-warn-soft-fg)]/40 bg-[var(--color-warn-soft-bg)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-warn-soft-fg)]">
                {t.common.demoMode} · {guard.reason}
              </span>
            )}
            <LanguageSwitcher />
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold"
              style={{
                background: "var(--lavender-200)",
                color: "var(--color-accent)",
              }}
              title={headerName}
              aria-hidden
            >
              {initials}
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
