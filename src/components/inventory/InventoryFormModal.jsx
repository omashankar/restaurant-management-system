"use client";

import Modal from "@/components/ui/Modal";
import { raInputCls } from "@/config/restaurantAdminTheme";

const CATEGORIES = [
  "Produce",
  "Meat",
  "Dairy",
  "Dry goods",
  "Beverages",
  "Frozen",
  "Other",
];

const UNITS = [
  "bottle",
  "kg",
  "g",
  "litre",
  "ml",
  "crate",
  "box",
  "case",
  "pack",
  "piece",
  "dozen",
  "wheel",
  "bag",
  "can",
  "jar",
];

export default function InventoryFormModal({
  open,
  title,
  form,
  onChange,
  onClose,
  onSubmit,
}) {
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
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ra-primary sm:w-auto"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className={raInputCls}
            placeholder="Item name"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Category
          </label>
          <input
            list="inventory-category-suggestions"
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            className={raInputCls}
            placeholder="e.g. Produce"
          />
          <datalist id="inventory-category-suggestions">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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
              className={raInputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">
              Unit
            </label>
            <select
              value={form.unit}
              onChange={(e) => onChange({ ...form, unit: e.target.value })}
              className={`cursor-pointer ${raInputCls}`}
            >
              <option value="" disabled>Select unit…</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
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
            className={raInputCls}
          />
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
