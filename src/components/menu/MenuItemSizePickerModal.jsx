"use client";

import Modal from "@/components/ui/Modal";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { normalizeMenuSizes, sizeOptionLabel } from "@/lib/menuItemSizes";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object|null} props.item
 * @param {() => void} props.onClose
 * @param {(size: { id: string, label: string, price: number }) => void} props.onSelect
 * @param {(amount: number) => string} props.formatMoney
 * @param {"admin"|"customer"} [props.tone]
 */
export default function MenuItemSizePickerModal({
  open,
  item,
  onClose,
  onSelect,
  formatMoney,
  tone = "admin",
}) {
  const sizes = normalizeMenuSizes(item?.sizes);
  if (!item || !sizes.length) return null;

  const titleType = sizeOptionLabel(item.sizeOptionType);
  const selectCls =
    tone === "customer"
      ? "w-full cursor-pointer rounded-xl border border-customer-border bg-[var(--customer-card)] px-4 py-3 text-left transition-colors hover:border-customer-primary/40"
      : "w-full cursor-pointer rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] px-4 py-3 text-left transition-colors hover:border-ra-primary-40";

  return (
    <Modal open={open} onClose={onClose} title={`Choose ${titleType.toLowerCase()}`}>
      <div className="space-y-3">
        <p className={`text-sm font-semibold ${tone === "customer" ? "text-customer-text" : adminSurface.title}`}>
          {item.name}
        </p>
        <p className={`text-xs ${tone === "customer" ? "text-customer-muted" : adminSurface.muted}`}>
          Select one option to add to your order.
        </p>
        <ul className="space-y-2">
          {sizes.map((size) => (
            <li key={size.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(size);
                  onClose();
                }}
                className={selectCls}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium">{size.label}</span>
                  <span className={`shrink-0 font-semibold tabular-nums ${tone === "customer" ? "text-customer-primary" : "text-ra-primary"}`}>
                    {formatMoney(size.price)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
