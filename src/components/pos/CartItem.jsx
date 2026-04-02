"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({
  line,
  onInc,
  onDec,
  onRemove,
  onSetQuantity,
}) {
  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-100">{line.name}</p>
          <p className="text-xs text-zinc-500">${line.price.toFixed(2)} each</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(line.id)}
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-500/15 hover:text-red-300"
          aria-label={`Remove ${line.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
          <button
            type="button"
            onClick={() => onDec(line.id)}
            className="rounded-md p-1 text-zinc-300 hover:bg-zinc-800"
            aria-label={`Decrease ${line.name}`}
          >
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            min={1}
            value={line.qty}
            onChange={(e) => onSetQuantity(line.id, e.target.value)}
            className="w-12 rounded-md border border-zinc-700 bg-zinc-950 px-1 py-1 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500/45"
            aria-label={`${line.name} quantity`}
          />
          <button
            type="button"
            onClick={() => onInc(line.id)}
            className="rounded-md p-1 text-zinc-300 hover:bg-zinc-800"
            aria-label={`Increase ${line.name}`}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="text-sm font-semibold text-zinc-100">
          ${(line.price * line.qty).toFixed(2)}
        </p>
      </div>
    </li>
  );
}
