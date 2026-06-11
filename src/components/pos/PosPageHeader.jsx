"use client";

import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { CheckCircle2, Monitor, ShoppingCart, Trash2 } from "lucide-react";

export default function PosPageHeader({
  cartItemCount,
  total,
  currency = "INR",
  onClearCart,
  setupReady,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
          <Monitor className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title text-xl font-semibold tracking-tight sm:text-2xl">POS</h1>
          <p className="admin-page-desc mt-1 hidden text-sm sm:block">
            1 Dine-In · 2 Takeaway · 3 Delivery · / Search · Ctrl+Enter Place
          </p>
          <p className="mt-1 text-xs admin-surface-muted xl:hidden">
            {setupReady ? "Order details ready — add menu items" : "Complete order details first"}
          </p>
        </div>
      </div>

      {cartItemCount > 0 && (
        <div className="hidden shrink-0 items-center gap-2 rounded-xl border admin-shell-border bg-[var(--admin-surface)] px-3 py-2 xl:flex">
          <ShoppingCart className="size-4 text-ra-primary" aria-hidden />
          <div className="text-right">
            <p className="text-xs admin-surface-muted">{cartItemCount} items in cart</p>
            <p className="text-sm font-semibold tabular-nums admin-shell-text">
              {formatAdminMoney(total, currency, { decimals: 2 })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearCart}
            className="cursor-pointer ml-1 rounded-lg p-2 admin-surface-muted transition-colors hover:bg-[var(--admin-hover)] hover:text-red-400"
            aria-label="Clear cart"
            title="Clear cart"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function PosFlowSteps({ setupReady, cartItemCount }) {
  const steps = [
    { id: "setup", label: "Details", done: setupReady },
    { id: "menu", label: "Menu", done: cartItemCount > 0 },
    { id: "pay", label: "Pay", done: false, active: setupReady && cartItemCount > 0 },
  ];

  return (
    <div className="flex items-center gap-1.5 xl:hidden">
      {steps.map((step, index) => {
        const active =
          step.active ||
          (!setupReady && step.id === "setup") ||
          (setupReady && cartItemCount === 0 && step.id === "menu") ||
          (setupReady && cartItemCount > 0 && step.id === "pay");
        return (
          <div key={step.id} className="flex min-w-0 flex-1 items-center gap-1.5">
            <div
              className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold sm:text-xs ${
                step.done
                  ? "bg-ra-primary/15 text-ra-primary ring-1 ring-ra-primary-25"
                  : active
                    ? `bg-[var(--admin-hover-strong)] admin-shell-text ${adminShell.ringSubtle}`
                    : "admin-surface-muted"
              }`}
            >
              {step.done ? <CheckCircle2 className="size-3 shrink-0" aria-hidden /> : null}
              <span className="truncate">{step.label}</span>
            </div>
            {index < steps.length - 1 ? (
              <span className={`h-px w-2 shrink-0 ${adminShell.divider} bg-[var(--admin-border-subtle)]`} aria-hidden />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
