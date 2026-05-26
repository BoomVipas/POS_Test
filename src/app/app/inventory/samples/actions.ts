"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, canManageSamples } from "@/lib/auth/workspace";
import { validateSampleMove } from "@/lib/inventory/samples";

export type SampleMoveInput = {
  eventId: string;
  productId: string;
  qty: number;
  /** current_qty when making a sample, sample_qty when returning — for the
   *  pre-flight cap check (the RPC re-checks atomically under FOR UPDATE). */
  available: number;
};

export type SampleActionResult =
  | { ok: true; currentQty: number; sampleQty: number }
  | { ok: false; error: string };

// Move stock between event-sellable (current_qty) and the sample bucket
// (sample_qty) through the security-definer RPCs, which own the atomic swap +
// audit row (hard rules #6/#7). Role-gated owner/manager/cashier/stock_staff
// (the RPC re-checks); degrades gracefully if the RPCs aren't applied yet.
async function convert(
  fn: "convert_event_to_sample" | "convert_sample_to_event",
  input: SampleMoveInput,
): Promise<SampleActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };
  if (!canManageSamples(ws.role)) {
    return { ok: false, error: "You don't have permission to manage samples." };
  }

  const v = validateSampleMove(input.qty, input.available);
  if (!v.ok) return v;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, {
    p_event_id: input.eventId,
    p_product_id: input.productId,
    p_qty: input.qty,
    p_reason: null,
  });

  if (error) {
    console.error(`[samples] ${fn} failed:`, error.message);
    const notSetUp =
      error.code === "42883" ||
      /function .* does not exist/i.test(error.message);
    if (notSetUp) {
      return {
        ok: false,
        error:
          "Sample conversion isn't set up yet — an admin needs to apply the sample RPCs.",
      };
    }
    if (/not enough/i.test(error.message)) {
      return {
        ok: false,
        error:
          fn === "convert_event_to_sample"
            ? "Not enough event stock to make a sample."
            : "Not enough samples to return.",
      };
    }
    if (/forbidden/i.test(error.message)) {
      return { ok: false, error: "You don't have permission to manage samples." };
    }
    return { ok: false, error: "Couldn't update samples. Please try again." };
  }

  // The RPC returns the updated event_inventory row (object, or a 1-row array
  // depending on supabase-js shaping).
  const row = (Array.isArray(data) ? data[0] : data) as
    | { current_qty?: number; sample_qty?: number }
    | null;

  revalidatePath("/app/inventory/samples");
  revalidatePath("/app/pos");
  return {
    ok: true,
    currentQty: row?.current_qty ?? 0,
    sampleQty: row?.sample_qty ?? 0,
  };
}

export async function makeSample(
  input: SampleMoveInput,
): Promise<SampleActionResult> {
  return convert("convert_event_to_sample", input);
}

export async function returnSample(
  input: SampleMoveInput,
): Promise<SampleActionResult> {
  return convert("convert_sample_to_event", input);
}
