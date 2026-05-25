"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, canWriteCatalog } from "@/lib/auth/workspace";
import { parseProductInput, type ProductInput } from "@/lib/products/parse";

export type ProductActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NO_WORKSPACE: ProductActionResult = {
  ok: false,
  error: "No workspace found for your account.",
};
const FORBIDDEN: ProductActionResult = {
  ok: false,
  error: "You don't have permission to change the catalog.",
};

// DD-44/51/53 — create a product against the real `products` table, scoped to
// the caller's workspace. RLS independently enforces membership + write role;
// the explicit workspace_id keeps hard rule #2 (every write carries it).
export async function createProduct(
  input: ProductInput,
): Promise<ProductActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return NO_WORKSPACE;
  if (!canWriteCatalog(ws.role)) return FORBIDDEN;

  const parsed = parseProductInput(input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("products")
    .insert({ workspace_id: ws.workspaceId, ...parsed.value })
    .select("id, default_starting_qty")
    .single();
  if (error || !created) {
    if ((error as { code?: string } | null)?.code === "23505") {
      return {
        ok: false,
        error: "That SKU already exists in your catalog.",
        fieldErrors: { sku: "Already exists" },
      };
    }
    console.error("[products] create failed:", error?.message);
    return { ok: false, error: "Couldn't save the product. Please try again." };
  }

  // Auto-allocate the new product into any OPEN event (planned/running) at its
  // starting qty, so it appears in the POS immediately — otherwise it stays
  // invisible until someone runs "Sync active products" in Events. Best-effort:
  // a failure here doesn't undo the create (the product still exists; you can
  // sync from Events). Idempotent via the (event_id, product_id) unique key.
  const { data: openEvents } = await supabase
    .from("events")
    .select("id")
    .eq("workspace_id", ws.workspaceId)
    .in("status", ["planned", "running"]);
  if (openEvents && openEvents.length > 0) {
    const rows = openEvents.map((e) => ({
      workspace_id: ws.workspaceId,
      event_id: e.id,
      product_id: created.id,
      starting_qty: created.default_starting_qty,
      current_qty: created.default_starting_qty,
    }));
    const { error: allocErr } = await supabase
      .from("event_inventory")
      .upsert(rows, { onConflict: "event_id,product_id", ignoreDuplicates: true });
    if (allocErr) {
      console.error("[products] auto-allocate failed:", allocErr.message);
    }
  }

  revalidatePath("/app/setup/products");
  revalidatePath("/app/pos");
  return { ok: true };
}

// DD-47 — edit everything except the SKU (immutable once created, so order_items
// keep a stable reference). Filtered by id AND workspace_id on top of RLS.
export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ProductActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return NO_WORKSPACE;
  if (!canWriteCatalog(ws.role)) return FORBIDDEN;

  const parsed = parseProductInput(input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  // Omit sku — it can't change after creation.
  const { sku: _sku, ...rest } = parsed.value;
  void _sku;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", ws.workspaceId);
  if (error) {
    console.error("[products] update failed:", error.message);
    return { ok: false, error: "Couldn't save your changes. Please try again." };
  }

  revalidatePath("/app/setup/products");
  return { ok: true };
}

// DD-48/52 — soft delete / active toggle. Inactive products stay in the table
// (so past order_items still resolve) but drop out of the POS catalog. A hard
// delete is never offered — products are referenced by order history.
export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<ProductActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return NO_WORKSPACE;
  if (!canWriteCatalog(ws.role)) return FORBIDDEN;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", ws.workspaceId);
  if (error) {
    console.error("[products] setActive failed:", error.message);
    return { ok: false, error: "Couldn't update the product. Please try again." };
  }

  revalidatePath("/app/setup/products");
  return { ok: true };
}
