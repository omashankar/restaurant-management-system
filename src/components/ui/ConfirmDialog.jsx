"use client";

import { adminModalOverlay, adminSurface } from "@/config/adminSurfaceClasses";
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
    <div className={`${adminModalOverlay} p-0 sm:p-4`}>
      <button
        type="button"
        className="cursor-pointer absolute inset-0 bg-black/60 backdrop-blur-sm duration-150"
        onClick={onCancel}
        aria-label="Dismiss"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className={`relative z-10 w-full min-w-0 max-w-md rounded-t-2xl p-4 shadow-2xl duration-150 sm:rounded-2xl sm:p-6 ${adminSurface.cardSolid}`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
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
            <h3 className={`font-semibold ${adminSurface.title}`}>{title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${adminSurface.muted}`}>{message}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className={`w-full sm:w-auto ${adminSurface.btnGhost}`}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto sm:py-2 ${
                  danger
                    ? "bg-red-500 text-white transition-colors hover-bg-red-400"
                    : "bg-ra-primary text-zinc-950 hover:brightness-110"
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
