"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  resendInviteErrorToast,
  resendInviteSuccessToast,
} from "@/lib/admin/invite-codes";
import { resendInviteEmail } from "./actions";

export function ResendInviteButton({
  inviteCodeId,
  brandName,
}: {
  inviteCodeId: string;
  brandName: string;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function onResend() {
    if (!confirm(`Resend invite email to "${brandName}"?`)) return;
    startTransition(async () => {
      const res = await resendInviteEmail(inviteCodeId);
      push(res.ok ? resendInviteSuccessToast(res.email) : resendInviteErrorToast(res.error));
    });
  }

  return (
    <Button variant="secondary" size="sm" onClick={onResend} loading={pending}>
      Resend email
    </Button>
  );
}
