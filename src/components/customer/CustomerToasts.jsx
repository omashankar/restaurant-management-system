"use client";

import { useCustomer } from "@/context/CustomerContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function CustomerToasts() {
  const { toasts } = useCustomer();

  return (
    <div className="fixed bottom-5 right-4 z-[200] flex flex-col gap-2 sm:right-5">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${
              t.type === "error"
                ? "border-red-200 bg-white text-red-700 shadow-red-100"
                : "border-[#22C55E]/30 bg-white text-[#15803D] shadow-[#22C55E]/10"
            }`}
          >
            <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
              t.type === "error" ? "bg-red-100" : "bg-[#22C55E]/15"
            }`}>
              {t.type === "error"
                ? <AlertCircle className="size-4 text-red-500" />
                : <CheckCircle2 className="size-4 text-[#22C55E]" />}
            </div>
            <span className="max-w-[220px] text-[#111827]">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
