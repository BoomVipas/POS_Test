import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Auth + workspace lookup must run on every request.
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

  const headerName =
    guard.mode === "configured" ? guard.workspaceName : "Demo Brand";

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-line bg-panel/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-5">
          <Link
            href="/app"
            className="font-display text-xl text-accent-strong"
          >
            {headerName}
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold text-accent-strong/85 sm:gap-4">
            <Link href="/app/pos" className="hover:text-accent">
              POS
            </Link>
            <Link href="/app/setup/products" className="hover:text-accent">
              Products
            </Link>
            <Link href="/app/dashboard" className="hover:text-accent">
              Dashboard
            </Link>
            <Link href="/app/send-later" className="hover:text-accent">
              Send-later
            </Link>
            <Link href="/app/settings" className="hover:text-accent">
              Settings
            </Link>
          </nav>
          {guard.mode === "demo" && (
            <span className="ml-auto rounded-full border border-[var(--color-warn-soft-fg)]/40 bg-[var(--color-warn-soft-bg)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-warn-soft-fg)]">
              Demo · {guard.reason}
            </span>
          )}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
