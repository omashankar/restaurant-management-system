"use client";

import { adminPageDrawerOverlay } from "@/config/adminSurfaceClasses";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function PageDrawer({ open, panelClassName, children, ariaLabel = "Panel" }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={adminPageDrawerOverlay} role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <div className={panelClassName}>{children}</div>
    </div>,
    document.body
  );
}
