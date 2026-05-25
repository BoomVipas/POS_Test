// Dev tool: give a specific user their OWN isolated workspace in the shared
// Supabase project — products + an event + stock, ready to sell.
//
// Why this exists: seed.sql promotes the *first* auth user, which doesn't work
// for a second developer (they'd clash with the founder). The app isolates by
// workspace_id (RLS), so each dev just needs their own workspace. Run:
//
//   node --env-file=.env.local scripts/seed-dev-workspace.mjs <email> ["Brand Name"]
//
// Idempotent: if the user already owns a workspace, it prints it and exits
// without creating anything. Uses the service-role key (bypasses RLS) — dev only.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/seed-dev-workspace.mjs <email>",
  );
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/seed-dev-workspace.mjs <email> ["Brand Name"]');
  process.exit(1);
}
const brandName = process.argv[3] || `${email.split("@")[0]} Dev`;

const H = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function rest(path, init = {}) {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, Prefer: "return=representation", ...(init.headers || {}) },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${init.method || "GET"} ${path} → ${r.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// 1) Find the auth user by email.
const authRes = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers: H });
const { users = [] } = await authRes.json();
const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(
    `No auth user for ${email}. Have them sign up via the app first (or create them in Supabase → Auth → Users), then re-run.`,
  );
  process.exit(1);
}

// 2) Idempotency: bail if they already own a workspace.
const owned = await rest(
  `workspaces?select=id,brand_name,slug&owner_user_id=eq.${user.id}`,
);
if (owned.length > 0) {
  console.log(
    `${email} already owns a workspace: "${owned[0].brand_name}" (${owned[0].slug}). Nothing to do.`,
  );
  process.exit(0);
}

// 3) Create the workspace (random-ish slug to avoid collisions in the shared DB).
const slug = `dev-${email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 12) || "dev"}-${Math.random().toString(36).slice(2, 6)}`;
const [ws] = await rest("workspaces", {
  method: "POST",
  body: JSON.stringify({
    brand_name: brandName,
    slug,
    owner_user_id: user.id,
    industry: "cat_product",
    status: "active",
    setup_complete: true,
  }),
});

// 4) Owner membership.
await rest("workspace_members", {
  method: "POST",
  body: JSON.stringify({ workspace_id: ws.id, user_id: user.id, role: "owner" }),
});

// 5) Demo products.
const products = await rest("products", {
  method: "POST",
  body: JSON.stringify(
    [
      ["DEV-001", "Cat Hoodie", "apparel", 89000, 30, true],
      ["DEV-002", "Catnip Toy", "toys", 19000, 100, true],
      ["DEV-003", "Cat Sticker Pack", "accessories", 9000, 200, true],
      ["DEV-004", "Premium Cat Treats", "food", 29000, 50, false],
      ["DEV-005", "Brushed Cat Bed", "home", 149000, 10, true],
    ].map(([sku, name, category, price_satang, default_starting_qty, send_later_enabled]) => ({
      workspace_id: ws.id,
      sku,
      name,
      category,
      price_satang,
      default_starting_qty,
      send_later_enabled,
    })),
  ),
});

// 6) A planned event + inventory allocated from each product's starting qty.
const [event] = await rest("events", {
  method: "POST",
  body: JSON.stringify({
    workspace_id: ws.id,
    name: "Dev Test Event",
    venue: "Localhost",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
    status: "planned",
  }),
});
await rest("event_inventory", {
  method: "POST",
  body: JSON.stringify(
    products.map((p) => ({
      workspace_id: ws.id,
      event_id: event.id,
      product_id: p.id,
      starting_qty: p.default_starting_qty,
      current_qty: p.default_starting_qty,
    })),
  ),
});

console.log(
  `Seeded workspace "${brandName}" (${slug}) for ${email}: ${products.length} products + event "${event.name}". Log in and you'll land in it.`,
);
