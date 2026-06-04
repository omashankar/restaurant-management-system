"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({
  line,
  currency = "INR",
  onInc,
  onDec,
  onRemove,
  onSetQuantity,
  onSetLineNote,
}) {
  return (
    <li className="rounded-xl border admin-shell-border bg-zinc-950/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium admin-shell-text">{line.name}</p>
          <p className="text-xs admin-surface-muted">
            {currency} {line.price.toFixed(2)} each
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(line.id)}
          className="cursor-pointer rounded-md p-1.5 admin-surface-muted transition-colors hover:bg-red-500/15 hover:text-red-300"
          aria-label={`Remove ${line.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg admin-surface-card p-1">
          <button
            type="button"
            onClick={() => onDec(line.id)}
            className="cursor-pointer rounded-md p-1 admin-surface-body hover:bg-[var(--admin-hover)]"
            aria-label={`Decrease ${line.name}`}
          >
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={line.qty}
            onChange={(e) => onSetQuantity(line.id, e.target.value)}
            className="w-12 rounded-md border admin-shell-border bg-zinc-950 px-1 py-1 text-center text-sm admin-shell-text outline-none focus-ra-primary"
            aria-label={`${line.name} quantity`}
          />
          <button
            type="button"
            onClick={() => onInc(line.id)}
            className="cursor-pointer rounded-md p-1 admin-surface-body hover:bg-[var(--admin-hover)]"
            aria-label={`Increase ${line.name}`}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="text-sm font-semibold admin-shell-text">
          {currency} {(line.price * line.qty).toFixed(2)}
        </p>
      </div>

      <input
        type="text"
        value={line.note ?? ""}
        onChange={(e) => onSetLineNote?.(line.id, e.target.value)}
        placeholder="Item note (e.g. less spicy)"
        className="mt-2 w-full rounded-lg border admin-shell-border bg-zinc-950/80 px-2.5 py-1.5 text-[11px] admin-shell-text outline-none placeholder:admin-surface-faint focus-ra-primary"
      />
    </li>
  );
}
