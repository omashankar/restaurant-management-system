"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function MobileDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-200 ${
        open ? "pointer-events-auto bg-black/40 opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close sidebar"
      />
      <button
        type="button"
        onClick={onClose}
        className={`absolute right-4 top-4 z-10 rounded-xl border border-zinc-800 bg-zinc-950/70 p-2 text-zinc-200 shadow-lg shadow-black/30 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close sidebar"
      >
        <X className="size-4" aria-hidden />
      </button>
      <div
        className={`absolute left-0 top-0 h-full w-[280px] max-w-[85vw] transform border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

