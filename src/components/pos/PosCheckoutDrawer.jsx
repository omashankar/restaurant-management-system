"use client";

import { adminModalOverlay, adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function PosCheckoutDrawer({
  open,
  onClose,
  title = "Review order",
  subtitle,
  itemCount = 0,
  total = 0,
  currency = "INR",
  children,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={`${adminModalOverlay} p-0 xl:hidden`}>
      <button
        type="button"
        aria-label="Close checkout"
        className="cursor-pointer absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 flex max-h-[min(92dvh,720px)] w-full min-w-0 max-w-full flex-col rounded-t-2xl border-t admin-shell-border bg-[var(--admin-elevated)] shadow-2xl"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2">
          <span className="h-1 w-10 rounded-full bg-[var(--admin-border)]" aria-hidden />
        </div>

        <div className={`flex shrink-0 items-center justify-between gap-3 border-b ${adminShell.borderB} px-4 py-3`}>
          <div className="min-w-0">
            <h2 className={`text-base font-semibold ${adminSurface.title}`}>{title}</h2>
            <p className="truncate text-xs admin-surface-muted">
              {subtitle ?? `${itemCount} item${itemCount === 1 ? "" : "s"} · ${formatAdminMoney(total, currency, { decimals: 2 })}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`cursor-pointer shrink-0 rounded-lg p-2 ${adminSurface.muted} hover:bg-[var(--admin-hover)] hover:admin-shell-text`}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body
  );
}
