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
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl shadow-black/40 ${
            t.type === "error"
              ? "border-red-500/30 bg-zinc-900 text-red-300"
              : "border-emerald-500/30 bg-zinc-900 text-emerald-300"
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
