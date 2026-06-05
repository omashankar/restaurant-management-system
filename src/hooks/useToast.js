"use client";
import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const ToastUI = toast ? (
    <div
      className={`fixed bottom-6 right-6 z-[300] flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all admin-surface-card-solid ${
        toast.type === "error"
          ? "border-red-500/30 text-red-400"
          : "border-ra-primary-30 text-ra-primary-muted"
      }`}
    >
      {toast.type === "error" ? "❌" : "✅"} {toast.msg}
    </div>
  ) : null;

  return { showToast, ToastUI };
}
