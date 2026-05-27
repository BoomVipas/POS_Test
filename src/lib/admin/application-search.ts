import type { ApplicationStatus, Database } from "@/lib/database.types";

export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "pending",
  "approved",
  "rejected",
  "invited",
  "registered",
];

export function parseApplicationStatus(value: string | undefined): ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as ApplicationStatus)
    : "pending";
}

export function normalizeApplicationSearch(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

export function applicationMatchesSearch(
  application: ApplicationRow,
  search: string,
): boolean {
  const needle = normalizeApplicationSearch(search).toLocaleLowerCase();
  if (!needle) return true;

  return [
    application.brand_name,
    application.owner_name,
    application.email,
    application.phone,
    application.product_category,
    application.status,
  ].some((value) => value.toLocaleLowerCase().includes(needle));
}

export function adminApplicationsHref({
  status,
  search,
}: {
  status: ApplicationStatus;
  search?: string;
}): string {
  const params = new URLSearchParams({ status });
  const normalizedSearch = normalizeApplicationSearch(search);
  if (normalizedSearch) params.set("q", normalizedSearch);
  return `/admin/applications?${params.toString()}`;
}
