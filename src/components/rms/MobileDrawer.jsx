"use client";

import { adminMobileOverlay, adminShell } from "@/config/adminSurfaceClasses";
import { useEffect } from "react";

export default function MobileDrawer({ open, onClose, children }) {
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

  return (
    <div
      className={`${adminMobileOverlay} ${
        open ? "pointer-events-auto bg-black/40 opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer absolute inset-0"
        aria-label="Close sidebar"
        tabIndex={open ? 0 : -1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`admin-shell-sidebar absolute left-0 top-0 z-[1] flex h-full w-[min(280px,85vw)] max-w-[85vw] transform flex-col border-r ${adminShell.borderR} transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {children}
      </div>
    </div>
  );
}
