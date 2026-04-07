"use client";

import Modal from "@/components/ui/Modal";

const CATEGORIES = [
  "Produce",
  "Meat",
  "Dairy",
  "Dry goods",
  "Beverages",
  "Frozen",
  "Other",
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
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            placeholder="Item name"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Category
          </label>
          <input
            list="inventory-category-suggestions"
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            placeholder="e.g. Produce"
          />
          <datalist id="inventory-category-suggestions">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Quantity
            </label>
            <input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) =>
                onChange({ ...form, quantity: e.target.value })
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Unit
            </label>
            <input
              value={form.unit}
              onChange={(e) => onChange({ ...form, unit: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
              placeholder="bottle, kg…"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Reorder level
          </label>
          <input
            type="number"
            min={0}
            value={form.reorderLevel}
            onChange={(e) =>
              onChange({ ...form, reorderLevel: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Supplier (optional)
          </label>
          <input
            value={form.supplier}
            onChange={(e) => onChange({ ...form, supplier: e.target.value })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
          />
        </div>
      </div>
    </Modal>
  );
}
