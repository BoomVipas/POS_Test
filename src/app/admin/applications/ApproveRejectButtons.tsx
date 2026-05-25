"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  approveSuccessToast,
  rejectSuccessToast,
  reviewErrorToast,
} from "@/lib/admin/application-review";
import { approveApplication, rejectApplication } from "./actions";

/**
 * Approve/Reject buttons for /admin/applications (DD-26).
 *
 * Approve mints the invite code (atomic `approve_application` RPC) and
 * best-effort emails it; Reject flips the application to rejected. Both are
 * guarded by a confirm because each acts on a real applicant — approve sends
 * them an email, reject takes them out of the approvable list. The success
 * toast surfaces the code so the admin can hand it over even if email is off.
 */
export function ApproveRejectButtons({
  applicationId,
  brandName,
}: {
  applicationId: string;
  brandName: string;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function onApprove() {
    if (!confirm(`Approve “${brandName}” and send them an invite code?`)) return;
    startTransition(async () => {
      const res = await approveApplication(applicationId);
      push(
        res.ok
          ? approveSuccessToast(res.code, res.emailed)
          : reviewErrorToast("approve", res.error),
      );
    });
  }

  function onReject() {
    if (!confirm(`Reject “${brandName}”? They won’t get an invite.`)) return;
    startTransition(async () => {
      const res = await rejectApplication(applicationId);
      push(res.ok ? rejectSuccessToast() : reviewErrorToast("reject", res.error));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="sm" onClick={onApprove} loading={pending}>
        Approve
      </Button>
      <Button variant="danger" size="sm" onClick={onReject} loading={pending}>
        Reject
      </Button>
    </div>
  );
}
