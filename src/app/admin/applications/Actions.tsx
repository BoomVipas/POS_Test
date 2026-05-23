"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { pendingApplicationToast } from "@/lib/admin/applications-pending";

/**
 * Approve/Reject buttons for /admin/applications.
 *
 * **Not yet wired** to Supabase — DD-26 lands the real server actions. Until
 * then the buttons stay clickable (so admins can see WHY nothing happens)
 * but the toast is honest about the pre-DD-26 state and no DB row changes.
 * Pinned by `tests/lib/admin-applications-pending.test.ts` (Wave 41b, finding L3).
 */
export function ApproveRejectButtons({
  applicationId,
}: {
  applicationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function emit(action: "approve" | "reject") {
    startTransition(() => {
      push(pendingApplicationToast(action, applicationId));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => emit("approve")}
        loading={pending}
      >
        Approve
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => emit("reject")}
        loading={pending}
      >
        Reject
      </Button>
      <span
        className="ml-1 text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--color-warn-soft-fg)" }}
      >
        Awaiting DD-26 wire-up
      </span>
    </div>
  );
}
