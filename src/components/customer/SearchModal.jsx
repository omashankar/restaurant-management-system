"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { customerClasses, customerInteractive } from "@/lib/customerTheme";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchModal({ open, onClose }) {
  const router = useRouter();
  const { link } = useRestaurantSlug();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return undefined;
    }

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    onClose();
    if (!q) {
      router.push(link("/order/menu"));
      return;
    }
    router.push(link(`/order/menu?q=${encodeURIComponent(q)}`));
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="ct-search-modal fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:items-center sm:px-6 sm:pt-0"
          role="dialog"
          aria-modal="true"
          aria-label="Search menu"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="ct-search-modal__panel relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-card)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--customer-border)] px-4 py-3.5 sm:px-5">
              <h2 className="font-poppins text-base font-bold text-customer-text">Search dishes</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-customer-muted transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-text"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <form
                onSubmit={handleSubmit}
                className={`ct-hero-search ct-search-modal__bar ${customerInteractive.inputWrap}`}
              >
                <Search className={`size-4 shrink-0 ${customerInteractive.inputIcon}`} aria-hidden />
                <input
                  autoFocus
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dishes…"
                  autoComplete="off"
                  aria-label="Search menu"
                  className={`${customerInteractive.input} min-w-0`}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className={`${customerClasses.btnPrimary} ct-hero-search__btn shrink-0 cursor-pointer border-0 text-xs font-bold shadow-none`}
                >
                  <ArrowRight className="size-4 sm:hidden" aria-hidden />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </form>

              <p className="mt-3 text-center text-xs text-customer-muted sm:text-left">
                Press Enter to browse matching dishes on the menu
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
