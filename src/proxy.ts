import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 + Turbopack registers this file via `functions-config-manifest.json`
// (key `/_middleware`); the legacy `middleware-manifest.json` is emitted but
// empty. Named export `proxy` is the supported shape — verified Wave 41d
// (2026-05-24). Shape pinned by `tests/lib/proxy.test.ts`.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
