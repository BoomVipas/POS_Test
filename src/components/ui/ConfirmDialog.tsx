"use client";

import { type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  /** Name the object being acted on, e.g. "Remove DEMO-001 — Cat Hoodie?". */
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions (delete, reset, cancel). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Named confirmation modal — the design-system replacement for native
 *  `window.confirm()`. Per the UX rule: destructive actions confirm in a
 *  styled modal that names the object, never a bare browser dialog. Focus
 *  lands on the dialog (not the destructive button), so Enter doesn't fire it
 *  by accident; Esc / backdrop / "Cancel" all dismiss without acting. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      {body && (
        <div className="text-sm leading-relaxed text-text/85">{body}</div>
      )}
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
