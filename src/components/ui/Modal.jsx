"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, title, onClose, children, footer }) {
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
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
      <div className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 duration-200">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          {title ? (
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-zinc-50"
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-zinc-800 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
