// Open-redirect-safe sanitiser for the post-login `?next=` destination.
//
// The `/app` guard sends unauthenticated users to `/login?next=/app`, and we
// want to honour that so a deep-linked seller lands where they meant to go.
// But `next` is attacker-controllable: `?next=https://evil.example` (or the
// protocol-relative `?next=//evil.example`, which a browser resolves to an
// absolute off-site URL) would let a phishing link bounce a freshly
// authenticated user off our origin. So we only ever honour a *same-origin
// absolute path*: it must start with a single "/", must not be protocol-
// relative ("//host" or "/\host"), and must not contain control characters.
// Anything else falls back to `/app`.

export const DEFAULT_NEXT = "/app";

// NUL..US and DEL — smuggled newlines/tabs/NULs that could split a header or
// confuse the router. Written as hex escapes so the source stays printable.
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

export function safeNextPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_NEXT,
): string {
  if (!raw) return fallback;

  const value = raw.trim();
  if (value === "") return fallback;

  if (CONTROL_CHARS.test(value)) return fallback;

  // Must be an absolute path on this origin.
  if (!value.startsWith("/")) return fallback;

  // Protocol-relative forms resolve off-origin in the browser. "/\" is the
  // backslash variant some browsers normalise to "//".
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

  return value;
}
