"use client";

import {
  canEditPosPaymentStatus,
  getPosPaymentHint,
  getPosPaymentMethods,
  shouldShowPosPaymentUI,
} from "@/lib/posPayment";
import { Receipt } from "lucide-react";

export default function PosPaymentSection({
  orderType,
  paymentMethod,
  paymentStatus,
  onPaymentMethodChange,
  onPaymentStatusChange,
}) {
  if (!shouldShowPosPaymentUI(orderType)) {
    return (
      <div className="flex gap-2.5 rounded-xl border border-ra-primary/20 bg-ra-primary/[0.06] px-3 py-2.5">
        <Receipt className="mt-0.5 size-4 shrink-0 text-ra-primary" aria-hidden />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ra-primary/90">Pay at bill</p>
          <p className="mt-0.5 text-[11px] leading-snug admin-surface-muted">{getPosPaymentHint(orderType)}</p>
        </div>
      </div>
    );
  }

  const methods = getPosPaymentMethods(orderType);
  const showStatus = canEditPosPaymentStatus(orderType, paymentMethod);

  return (
    <div className="space-y-2 rounded-xl admin-surface-card p-2.5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">Payment</p>
        <p className="mt-0.5 text-[10px] leading-snug admin-surface-faint">{getPosPaymentHint(orderType)}</p>
      </div>

      <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
        {methods.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onPaymentMethodChange?.(id)}
            className={`cursor-pointer rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all sm:py-1.5 ${
              paymentMethod === id
                ? "bg-ra-primary/20 text-ra-primary-muted ring-1 ring-ra-primary-25"
                : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showStatus ? (
        <div className="flex gap-1">
          {[
            { id: "paid", label: "Paid" },
            { id: "pending", label: "Pending" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onPaymentStatusChange?.(id)}
              className={`cursor-pointer flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                paymentStatus === id
                  ? id === "paid"
                    ? "bg-ra-primary text-zinc-950"
                    : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                  : "bg-zinc-900 admin-surface-muted hover:admin-surface-body"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-amber-400/90">Payment marked pending until delivery.</p>
      )}
    </div>
  );
}
