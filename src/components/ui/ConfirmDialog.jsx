"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
  open,
  title = "Confirm delete",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = true,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="cursor-pointer absolute inset-0 bg-black/60 backdrop-blur-sm duration-150"
        onClick={onCancel}
        aria-label="Dismiss"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl duration-150"
      >
        <div className="flex gap-4">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
              danger
                ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"
                : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25"
            }`}
          >
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {message}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  danger
                    ? "bg-red-500 text-white hover:bg-red-400"
                    : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
