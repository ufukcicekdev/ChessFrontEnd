"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="card max-w-sm w-full flex flex-col gap-4 p-6 border-white/10">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-400">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm px-4">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm px-4 ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
