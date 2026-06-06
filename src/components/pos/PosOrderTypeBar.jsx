"use client";

import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { Bike, ConciergeBell, Store } from "lucide-react";

const ORDER_TYPES = [
  { id: "dine-in", label: "Dine-In", Icon: Store },
  { id: "takeaway", label: "Takeaway", Icon: ConciergeBell },
  { id: "delivery", label: "Delivery", Icon: Bike },
];

export default function PosOrderTypeBar({
  orderType,
  onOrderTypeChange,
  onTableSelect,
  onClearFieldError,
  className = "",
}) {
  return (
    <div className={`flex gap-1 rounded-xl ${adminShell.border} bg-[var(--admin-surface)] p-1 ${className}`}>
      {ORDER_TYPES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            onOrderTypeChange(id);
            onTableSelect?.("");
            onClearFieldError?.("table");
            onClearFieldError?.("customer");
            onClearFieldError?.("deliveryName");
            onClearFieldError?.("deliveryPhone");
            onClearFieldError?.("deliveryAddress");
          }}
          className={`cursor-pointer flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-semibold transition-all sm:gap-1.5 sm:px-2 sm:text-xs ${
            orderType === id
              ? "bg-ra-primary text-zinc-950 shadow-sm"
              : `${adminSurface.muted} hover:bg-[var(--admin-hover)] hover:admin-shell-text`
          }`}
          aria-pressed={orderType === id}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

export { ORDER_TYPES };
