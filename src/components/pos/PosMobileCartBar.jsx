"use client";

import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

export default function PosMobileSetupCard({
  id = "pos-setup",
  summary,
  ready = false,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const setOpen = (value) => {
    if (openProp == null) setInternalOpen(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    if (ready && openProp == null) setInternalOpen(false);
  }, [ready, openProp]);

  return (
    <div
      id={id}
      className={`scroll-mt-28 overflow-hidden rounded-2xl xl:hidden ${adminShell.border} ${
        ready ? "border-ra-primary-25 bg-ra-primary/[0.03]" : ""
      } bg-[var(--admin-surface)]`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`cursor-pointer flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${adminSurface.body}`}
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          {ready ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ra-primary" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold admin-shell-text">Order details</p>
            <p className="line-clamp-2 break-words text-xs admin-surface-muted">{summary}</p>
          </div>
        </div>
        {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
      </button>
      {open ? <div className={`border-t ${adminShell.borderT}`}>{children}</div> : null}
    </div>
  );
}

export function PosMobileCartBar({
  itemCount,
  total,
  currency = "INR",
  setupReady = false,
  onOpenSetup,
  onOpenCheckout,
  hidden = false,
}) {
  if (itemCount <= 0 || hidden) return null;

  const handlePrimary = () => {
    if (setupReady) onOpenCheckout?.();
    else onOpenSetup?.();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t admin-shell-border bg-[var(--admin-elevated)]/95 px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md xl:hidden sm:px-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-stretch gap-2">
        {!setupReady ? (
          <button
            type="button"
            onClick={onOpenSetup}
            className="cursor-pointer shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/15"
          >
            Details
          </button>
        ) : null}

        <button
          type="button"
          onClick={handlePrimary}
          className={`cursor-pointer flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left transition-all active:scale-[0.99] ${
            setupReady
              ? "bg-ra-primary text-zinc-950 hover:brightness-110"
              : "bg-zinc-800 admin-shell-text hover:bg-zinc-700"
          }`}
        >
          <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {itemCount} item{itemCount === 1 ? "" : "s"}
              {setupReady ? " · Review & pay" : " · Finish setup first"}
            </span>
          </span>
          <span className="truncate text-sm font-bold tabular-nums sm:text-base">
            {formatAdminMoney(total, currency, { decimals: 2 })}
          </span>
        </button>
      </div>
    </div>
  );
}
