"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveWorkspace,
  canManageEvents,
  canWriteCatalog,
} from "@/lib/auth/workspace";
import {
  parseEventInput,
  isEventStatus,
  type EventInput,
  type EventStatus,
} from "@/lib/events/parse";

export type EventActionResult =
  | { ok: true; eventId?: string; allocated?: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NO_WORKSPACE: EventActionResult = {
  ok: false,
  error: "No workspace found for your account.",
};

// Wave 43 — create an event (status 'planned'; create_order accepts planned or
// running). Workspace-scoped + role-gated (owner/manager) on top of RLS.
export async function createEvent(
  input: EventInput,
): Promise<EventActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return NO_WORKSPACE;
  if (!canManageEvents(ws.role)) {
    return { ok: false, error: "You don't have permission to create events." };
  }

  const parsed = parseEventInput(input);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ workspace_id: ws.workspaceId, ...parsed.value, status: "planned" })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[events] create failed:", error?.code, error?.message);
    // Pilot diagnostics: surface the real DB reason (the two founders are the
    // only users today) so manual testers see WHY it failed instead of a generic
    // toast — this is how we'll pin the "any input errors" report. Genericize
    // before public launch.
    return {
      ok: false,
      error: error
        ? `Couldn't create the event — ${error.message} [${error.code ?? "?"}]`
        : "Couldn't create the event. Please try again.",
    };
  }

  revalidatePath("/app/events");
  return { ok: true, eventId: data.id };
}

// Allocate the workspace's active products into this event's inventory at each
// product's default_starting_qty. Idempotent: existing allocations are left
// untouched (ignoreDuplicates), so re-syncing after adding products never resets
// current/sold counts. Stock-write roles only (owner/manager/stock_staff).
export async function allocateActiveProducts(
  eventId: string,
): Promise<EventActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return NO_WORKSPACE;
  if (!canWriteCatalog(ws.role)) {
    return { ok: false, error: "You don't have permission to allocate stock." };
  }

  const supabase = await createClient();
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("workspace_id", ws.workspaceId)
    .maybeSingle();
  if (!ev) return { ok: false, error: "Event not found." };

  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, default_starting_qty")
    .eq("workspace_id", ws.workspaceId)
    .eq("is_active", true);
  if (pErr) {
    console.error("[events] read products failed:", pErr.message);
    return { ok: false, error: "Couldn't read your products." };
  }
  if (!products || products.length === 0) {
    return {
      ok: false,
      error: "No active products to allocate — add products first.",
    };
  }

  const rows = products.map((p) => ({
    workspace_id: ws.workspaceId,
    event_id: eventId,
    product_id: p.id,
    starting_qty: p.default_starting_qty,
    current_qty: p.default_starting_qty,
  }));
  const { error: insErr } = await supabase
    .from("event_inventory")
    .upsert(rows, { onConflict: "event_id,product_id", ignoreDuplicates: true });
  if (insErr) {
    console.error("[events] allocate failed:", insErr.message);
    return { ok: false, error: "Couldn't allocate stock. Please try again." };
  }

  revalidatePath("/app/events");
  return { ok: true, allocated: rows.length };
}

// Start (running) / close / reopen an event. Owner/manager only.
export async function setEventStatus(
  eventId: string,
  status: EventStatus,
): Promise<EventActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return NO_WORKSPACE;
  if (!canManageEvents(ws.role)) {
    return { ok: false, error: "You don't have permission to change events." };
  }
  if (!isEventStatus(status)) return { ok: false, error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .eq("workspace_id", ws.workspaceId);
  if (error) {
    console.error("[events] setStatus failed:", error.message);
    return { ok: false, error: "Couldn't update the event. Please try again." };
  }

  revalidatePath("/app/events");
  return { ok: true };
}
