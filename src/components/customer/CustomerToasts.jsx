"use client";

import { useCustomer } from "@/context/CustomerContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function CustomerToasts() {
  const { toasts } = useCustomer();

  return (
    <div className="fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] right-4 z-[200] flex max-w-[min(100vw-2rem,20rem)] flex-col gap-2 sm:bottom-5 sm:right-5 sm:max-w-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`ct-toast ct-elevation-float flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-sm ${
              t.type === "error" ? "ct-toast--error" : "ct-toast--success"
            }`}
          >
            <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
              t.type === "error" ? "bg-red-100" : "bg-[#22C55E]/15"
            }`}>
              {t.type === "error"
                ? <AlertCircle className="size-4 text-red-500" />
                : <CheckCircle2 className="size-4 text-[#22C55E]" />}
            </div>
            <span className="min-w-0 flex-1 break-words text-customer-text">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
