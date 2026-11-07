"use client";

import { Button } from "@mantle-ui/react/button";
import { Dialog } from "@mantle-ui/react/dialog";

type ConfirmDeleteDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteDialog({
  visible,
  title,
  message,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const footer = (
    <>
      <Button label="Cancel" severity="secondary" outlined onClick={onCancel} disabled={pending} />
      <Button
        label="Delete"
        severity="danger"
        icon="mi mi-trash"
        onClick={onConfirm}
        loading={pending}
      />
    </>
  );

  return (
    <Dialog
      visible={visible}
      header={title}
      footer={footer}
      onHide={onCancel}
      modal
      closable={!pending}
      dismissableMask={!pending}
      style={{ width: "26rem" }}
      className="confirm-delete-dialog"
      aria-labelledby="confirm-delete-header"
    >
      <div className="confirm-delete-dialog-body">
        <i className="mi mi-exclamation-triangle confirm-delete-dialog-icon" aria-hidden="true" />
        <span id="confirm-delete-message">{message}</span>
      </div>
    </Dialog>
  );
}
