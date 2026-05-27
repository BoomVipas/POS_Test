"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  cancelInviteErrorToast,
  cancelInviteSuccessToast,
} from "@/lib/admin/invite-codes";
import { cancelInviteCode } from "./actions";

export function CancelInviteButton({
  inviteCodeId,
  brandName,
}: {
  inviteCodeId: string;
  brandName: string;
}) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function onCancel() {
    if (!confirm(`Cancel the invite code for "${brandName}"?`)) return;

    startTransition(async () => {
      const res = await cancelInviteCode(inviteCodeId);
      push(res.ok ? cancelInviteSuccessToast() : cancelInviteErrorToast(res.error));
    });
  }

  return (
    <Button variant="danger" size="sm" onClick={onCancel} loading={pending}>
      Cancel
    </Button>
  );
}
