---
name: wire-supabase-page
description: Step-by-step checklist for wiring a MochiPOS demo-mode page to live Supabase data. Use when a page still reads from localStorage (useDemoX hooks) and needs a real server-component data path. Covers the isConfigured() branch pattern, ConfiguredServer component conventions, react-hooks/purity pitfalls, URL-param filtering, and the demo fallback rule. Invoke when the user asks to "wire X to Supabase", "make X live", or when /check-demo-readiness flags a page.
user-invocable: true
---

# Wire a demo page to Supabase — checklist

Applies to pages in `src/app/app/` that currently use `useDemoX` hooks and need a live Supabase data path. The pattern keeps the demo fallback intact (no localStorage for business data on the live path).

## Prior art (read these for reference)
- `src/app/app/audit-log/` — Wave 55 (PR #135): filter via `?action=` param
- `src/app/app/customers/` — Wave 56 (PR #137): two-query aggregation, `?stage=` filter
- `src/app/app/dashboard/` — Wave 51 (PR #110, Codex): `getTodayStats` etc. in `lib/dashboard/queries.ts`

---

## Step 1 — Update `page.tsx`

```ts
export const dynamic = "force-dynamic";   // always add this

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export default async function XPage({
  searchParams,                            // add only if you need URL-based filter
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";       // validate as needed

  return (
    <main ...>
      {/* header JSX */}
      {isConfigured()
        ? <XConfiguredServer filter={filter} />
        : <XDemoComponent />               // existing demo component, untouched
      }
    </main>
  );
}
```

---

## Step 2 — Create `XConfiguredServer.tsx`

```ts
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";

// ── ALL impure computation goes here, NOT inside the component ─────────────
// Rule: react-hooks/purity fires if Date.now(), Math.random(), or any
// non-deterministic call appears in the async component function body.
// Fix: extract to a module-level async function.

async function loadX(workspaceId: string): Promise<{ rows: XRow[]; error: string | null }> {
  const supabase = await createClient();
  const nowMs = Date.now();                // safe here — module-level, not in React render

  const { data, error } = await supabase
    .from("your_table")
    .select("...")
    .eq("workspace_id", workspaceId)      // ALWAYS filter by workspace_id
    .order("created_at", { ascending: false });

  if (error) return { rows: [], error: error.message };
  // ...transform data...
  return { rows, error: null };
}

// ── Component — only calls loadX and renders ──────────────────────────────

export async function XConfiguredServer({ filter }: { filter: string }) {
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const { rows, error } = await loadX(ws.workspaceId);

  if (error) return <ErrorBanner message={error} />;
  if (rows.length === 0) return <EmptyState />;

  const visible = filter === "all" ? rows : rows.filter(r => r.type === filter);

  return (/* render */);
}
```

**Critical rules:**
- `import "server-only"` at the top
- Every query has `.eq("workspace_id", workspaceId)`
- Use `createClient()` (user session), not `createAdminClient()`, for reads
- `Date.now()` and any impure call → module-level function, never inside the component

---

## Step 3 — URL-param filters (optional)

Use `<a href="?filter=x">` links (not client state) for filter tabs. The server component re-runs on each navigation. This avoids `"use client"` and keeps the page fully server-rendered.

```tsx
// Filter tab (inside XConfiguredServer return):
<a
  href={f === "all" ? "/app/x" : `/app/x?filter=${f}`}
  className={filter === f ? "active-class" : "inactive-class"}
>
  {f === "all" ? `All ${rows.length}` : `${LABEL[f]} ${count}`}
</a>
```

---

## Step 4 — Branch + TASKS.md

```
git checkout -b pos/wave-NN-x-live
```

Before any code edit, update TASKS.md:
```
## Wave NN — X page live *(in-progress)*
- Owner: claude · Branch: pos/wave-NN-x-live · Claimed: YYYY-MM-DD
```

---

## Step 5 — Typecheck + lint + test + PR

```bash
npx tsc --noEmit
npm run lint          # must be 0 problems
npm test              # must be 616+ passing
git push -u origin pos/wave-NN-x-live
gh pr create ...
```

---

## What NOT to do

- Do not call `Date.now()` inside the async component function — extract to module-level
- Do not query without `.eq("workspace_id", ...)` — hard rule #2 in CLAUDE.md
- Do not touch the demo fallback component — it stays for the `!isConfigured()` path
- Do not use `createAdminClient()` for read queries on user-facing pages
- Do not add `"use client"` to the ConfiguredServer file
