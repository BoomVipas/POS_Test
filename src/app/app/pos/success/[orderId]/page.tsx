import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import {
  toReceiptView,
  type OrderRow,
  type OrderItemRow,
  type PaymentRow,
} from "@/lib/pos/receipt";
import { SuccessClient } from "./SuccessClient";
import { RealReceipt } from "./RealReceipt";

// Reads a workspace-scoped order, so it can't be statically prerendered.
export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PosSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  // A real Supabase order id is a uuid we can find in the caller's workspace.
  // Demo orders (localStorage, "demo-…" ids) and the unconfigured build fall
  // through to the demo SuccessClient. The uuid guard avoids a pointless 400 on
  // non-uuid demo ids.
  if (isConfigured() && UUID_RE.test(orderId)) {
    const ws = await getActiveWorkspace();
    if (ws) {
      const supabase = await createClient();
      const { data: order } = await supabase
        .from("orders")
        .select(
          "order_number, created_at, payment_method, subtotal_satang, discount_satang, shipping_fee_satang, total_satang",
        )
        .eq("id", orderId)
        .eq("workspace_id", ws.workspaceId)
        .maybeSingle();

      if (order) {
        const [{ data: items }, { data: payments }] = await Promise.all([
          supabase
            .from("order_items")
            .select(
              "sku, product_name, qty, unit_price_satang, line_total_satang, fulfillment_type, is_sample, note",
            )
            .eq("order_id", orderId)
            .eq("workspace_id", ws.workspaceId)
            .order("created_at", { ascending: true }),
          supabase
            .from("payment_records")
            .select("payment_method, amount_satang")
            .eq("order_id", orderId)
            .eq("workspace_id", ws.workspaceId),
        ]);

        const { data: tokens } = await supabase
          .from("customer_registration_tokens")
          .select("token, claimed_at, expires_at, created_at")
          .eq("order_id", orderId)
          .eq("workspace_id", ws.workspaceId)
          .order("created_at", { ascending: false })
          .limit(5);

        const activeToken =
          tokens?.find((t) => !t.claimed_at) ?? tokens?.[0] ?? null;

        const view = toReceiptView(
          order as OrderRow,
          (items ?? []) as OrderItemRow[],
          (payments ?? []) as PaymentRow[],
        );
        return (
          <RealReceipt
            view={view}
            orderId={orderId}
            registrationToken={
              activeToken
                ? {
                    token: activeToken.token,
                    claimedAt: activeToken.claimed_at,
                    expiresAt: activeToken.expires_at,
                  }
                : null
            }
          />
        );
      }
    }
  }

  // Demo order (localStorage) or unconfigured deployment.
  return <SuccessClient orderId={orderId} />;
}
