import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

// DD-41 — per-request session refresh. `src/proxy.ts` runs this on every
// non-asset request (matcher verified Wave 41d, pinned by tests/lib/proxy.test.ts).
// The `getUser()` call below revalidates the access token; when it's refreshed,
// supabase-js writes the rotated cookies through `setAll`, which rebuilds
// `response` with the new `Set-Cookie` headers — so a logged-in seller's session
// is kept alive across navigations and won't expire mid-shift at the booth.
//
// P1-A fix: After session refresh, unauthenticated requests to protected route
// prefixes are bounced at the edge — before the layout or any server component
// runs. This is a second wall of defence; the layout guards remain in place as
// the primary semantic check (membership, workspace existence, admin role).
const PROTECTED_PREFIXES = ["/app", "/admin", "/onboarding"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Soft-fail when env is missing so the app still renders public pages locally.
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Always refresh the session first — rotates the access token if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // P1-A: Block unauthenticated access to protected routes at the middleware
  // layer. The layout guards (app/layout.tsx, admin/layout.tsx, onboarding/page.tsx)
  // remain the authoritative membership/role checks. This guard is purely
  // "is there ANY session?" — a fast, cheap second wall.
  if (!user && isProtected(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
