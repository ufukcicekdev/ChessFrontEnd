"use client";
import { useEffect } from "react";
import { clsx } from "clsx";

export type ToastType = "success" | "error" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastData[];
  remove: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function Toast({ toast, remove }: { toast: ToastData; remove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => remove(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, remove]);

  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium animate-slide-up min-w-[260px] max-w-sm",
        STYLES[toast.type]
      )}
    >
      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0 font-bold">
        {ICONS[toast.type]}
      </span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => remove(toast.id)}
        className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, remove }: ToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} remove={remove} />
      ))}
    </div>
  );
}
