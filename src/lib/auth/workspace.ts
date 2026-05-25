import "server-only";
import { createClient } from "@/lib/supabase/server";

// Resolves the signed-in user's active workspace from their session. The /app
// layout already guarantees a provisioned member reaches app pages; Server
// Actions use this to scope every write to the right workspace_id (hard rule #2)
// and to gate on role. Pilot assumption: one workspace per user (the register
// flow enforces it), so we take the first membership row.
export type ActiveWorkspace = { workspaceId: string; role: string };

export async function getActiveWorkspace(): Promise<ActiveWorkspace | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  return { workspaceId: data.workspace_id, role: data.role };
}

// Roles allowed to mutate the catalog — matches the products RLS policies
// (products_member_insert / _update: owner, manager, stock_staff).
export const CATALOG_WRITE_ROLES = ["owner", "manager", "stock_staff"] as const;

export function canWriteCatalog(role: string): boolean {
  return (CATALOG_WRITE_ROLES as readonly string[]).includes(role);
}
