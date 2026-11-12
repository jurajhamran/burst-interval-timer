import { useEffect, useRef } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = "hidden";
      }
    } else {
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = "";
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleCancelEvent = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onCancel();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancelEvent}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-surface-2 p-5 text-fg shadow-xl backdrop:bg-[var(--overlay)] outline-none"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="rounded-full bg-surface-3 px-4 py-2 text-sm font-medium hover:bg-surface-3/80 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-work px-4 py-2 text-sm font-medium text-on-color hover:opacity-95 transition-opacity"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
