"use client";

import { adminModalOverlay, adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, title, onClose, children, footer, wide = false }) {
  const titleId = title ? "modal-title" : undefined;
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
    <div
      className={adminModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="cursor-pointer absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        className={`relative z-10 flex max-h-[min(92dvh,800px)] w-full min-w-0 ${wide ? "max-w-2xl" : "max-w-lg"} flex-col rounded-t-2xl shadow-2xl duration-200 sm:rounded-2xl ${adminSurface.cardSolid}`}
        style={{ paddingBottom: "max(0rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-[var(--admin-border)]" aria-hidden />
        </div>

        <div
          className={`flex shrink-0 items-start justify-between gap-3 border-b ${adminShell.borderB} px-4 py-3 sm:items-center sm:px-5 sm:py-4`}
        >
          {title ? (
            <h2 id={titleId} className="min-w-0 flex-1 break-words text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </h2>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          <button
            type="button"
            onClick={onClose}
            className={`cursor-pointer shrink-0 rounded-lg p-1.5 ${adminSurface.muted} transition-colors hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]`}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className={`shrink-0 border-t ${adminShell.borderT} px-4 py-3 sm:px-5 sm:py-4`}>{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
