// Demo audit log persisted to localStorage.
// Replaced by Supabase `audit_logs` table at DD-32/97. Marked clearly so the
// future swap is a focused refactor.

export const DEMO_AUDIT_KEY = "pos-for-sell:demo-audit:v1";

export type DemoAuditAction =
  | "settings_update"
  | "catalog_create"
  | "catalog_update"
  | "catalog_delete"
  | "catalog_set_active"
  | "order_create"
  | "order_void"
  | "send_later_status_change"
  | "demo_reset"
  | "demo_seed";

export type DemoAuditEntry = {
  id: string;
  action: DemoAuditAction;
  targetTable: string;
  targetId: string | null;
  summary: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string; // ISO
};

export function readDemoAudit(): DemoAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeDemoAudit(entries: DemoAuditEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_AUDIT_KEY, JSON.stringify(entries));
  } catch {
    // quota — silently drop
  }
}

export function clearDemoAudit(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_AUDIT_KEY);
}

export function appendDemoAudit(
  entry: Omit<DemoAuditEntry, "id" | "createdAt">,
): void {
  if (typeof window === "undefined") return;
  const all = readDemoAudit();
  const next: DemoAuditEntry = {
    ...entry,
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  // Keep at most 500 entries to bound localStorage growth.
  const trimmed = [next, ...all].slice(0, 500);
  writeDemoAudit(trimmed);
}
