"use client";

import { useCustomer } from "@/context/CustomerContext";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function CustomerToasts() {
  const { toasts } = useCustomer();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-emerald-300 bg-emerald-50 text-emerald-700"
          }`}
        >
          {t.type === "error"
            ? <AlertCircle className="size-4 shrink-0" />
            : <CheckCircle2 className="size-4 shrink-0" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
