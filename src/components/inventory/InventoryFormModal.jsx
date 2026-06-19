"use client";

import Modal from "@/components/ui/Modal";
import { raInputCls } from "@/config/restaurantAdminTheme";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
} from "@/components/inventory/inventoryUtils";
import { useMemo } from "react";

export default function InventoryFormModal({
  open,
  title,
  form,
  fieldErrors = {},
  onChange,
  onClose,
  onSubmit,
}) {
  const categoryOptions = useMemo(() => {
    const current = String(form.category ?? "").trim();
    if (current && !INVENTORY_CATEGORIES.includes(current)) {
      return [...INVENTORY_CATEGORIES, current];
    }
    return INVENTORY_CATEGORIES;
  }, [form.category]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium admin-shell-text transition-colors hover:bg-[var(--admin-hover)] sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="ra-btn-primary inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold sm:w-auto"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="min-w-0 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className={`${raInputCls} ${fieldErrors.name ? "border-red-500/50" : ""}`}
            placeholder="Item name"
            aria-invalid={fieldErrors.name ? true : undefined}
          />
          {fieldErrors.name ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            className={`cursor-pointer ${raInputCls} ${fieldErrors.category ? "border-red-500/50" : ""}`}
            aria-invalid={fieldErrors.category ? true : undefined}
          >
            <option value="" disabled>
              Select category…
            </option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {fieldErrors.category ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.category}</p>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">
              Quantity
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.quantity}
              onChange={(e) =>
                onChange({ ...form, quantity: e.target.value })
              }
              className={`${raInputCls} ${fieldErrors.quantity ? "border-red-500/50" : ""}`}
              aria-invalid={fieldErrors.quantity ? true : undefined}
            />
            {fieldErrors.quantity ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.quantity}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">
              Unit
            </label>
            <select
              value={form.unit}
              onChange={(e) => onChange({ ...form, unit: e.target.value })}
              className={`cursor-pointer ${raInputCls} ${fieldErrors.unit ? "border-red-500/50" : ""}`}
              aria-invalid={fieldErrors.unit ? true : undefined}
            >
              <option value="" disabled>
                Select unit…
              </option>
              {INVENTORY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {fieldErrors.unit ? (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.unit}</p>
            ) : null}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Reorder level
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={form.reorderLevel}
            onChange={(e) =>
              onChange({ ...form, reorderLevel: e.target.value })
            }
            className={`${raInputCls} ${fieldErrors.reorderLevel ? "border-red-500/50" : ""}`}
            aria-invalid={fieldErrors.reorderLevel ? true : undefined}
          />
          {fieldErrors.reorderLevel ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.reorderLevel}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Supplier (optional)
          </label>
          <input
            value={form.supplier}
            onChange={(e) => onChange({ ...form, supplier: e.target.value })}
            className={raInputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
            className="admin-surface-input focus-ra-primary w-full resize-none px-3 py-2 text-sm"
          />
        </div>
      </div>
    </Modal>
  );
}
