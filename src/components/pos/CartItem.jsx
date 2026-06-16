"use client";

import AdminFoodTypeIndicator from "@/components/menu/AdminFoodTypeIndicator";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { ITEM_TYPE_META } from "@/types/menu";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const FALLBACK_IMAGE = "https://placehold.co/120x120/18181b/52525b?text=+";

export default function CartItem({
  line,
  index,
  currency = "INR",
  compact = false,
  onInc,
  onDec,
  onRemove,
  onSetQuantity,
  onSetLineNote,
}) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = imgError || !line.image ? FALLBACK_IMAGE : line.image;
  const typeMeta = line.itemType ? ITEM_TYPE_META[line.itemType] : null;
  const lineTotal = line.price * line.qty;

  return (
    <li className="min-w-0 shrink-0 border-t admin-shell-border py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border admin-shell-border bg-zinc-950 sm:size-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
          {index != null ? (
            <span className="absolute left-0 top-0 rounded-br-md bg-zinc-950/85 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-zinc-300">
              #{index}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="flex items-start gap-1.5 text-sm font-semibold leading-snug admin-shell-text">
                {line.itemType ? (
                  <AdminFoodTypeIndicator type={line.itemType} size={13} />
                ) : null}
                <span className="min-w-0 break-words">{line.name}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] admin-surface-muted">
                {line.categoryName ? <span className="truncate">{line.categoryName}</span> : null}
                {typeMeta ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${typeMeta.badge}`}>
                    {typeMeta.label}
                  </span>
                ) : null}
                <span className="tabular-nums">
                  {formatAdminMoney(line.price, currency, { decimals: 2 })} each
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="text-sm font-bold tabular-nums text-ra-primary">
                {formatAdminMoney(lineTotal, currency, { decimals: 2 })}
              </p>
              <button
                type="button"
                onClick={() => onRemove(line.id)}
                className="cursor-pointer rounded-md p-1 admin-surface-muted transition-colors hover-bg-red-15 hover-red-danger"
                aria-label={`Remove ${line.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-0.5 rounded-lg border admin-shell-border bg-[var(--admin-surface)] p-0.5">
              <button
                type="button"
                onClick={() => onDec(line.id)}
                className="cursor-pointer rounded-md p-1.5 admin-surface-body hover:bg-[var(--admin-hover)]"
                aria-label={`Decrease ${line.name}`}
              >
                <Minus className="size-3.5" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={line.qty}
                onChange={(e) => onSetQuantity(line.id, e.target.value)}
                className="w-10 rounded-md border-0 bg-transparent py-1 text-center text-sm font-semibold tabular-nums admin-shell-text outline-none focus:ring-1 focus:ring-ra-primary-25"
                aria-label={`${line.name} quantity`}
              />
              <button
                type="button"
                onClick={() => onInc(line.id)}
                className="cursor-pointer rounded-md p-1.5 admin-surface-body hover:bg-[var(--admin-hover)]"
                aria-label={`Increase ${line.name}`}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            {!compact ? (
              <span className="text-[11px] tabular-nums admin-surface-faint">
                Qty {line.qty}
              </span>
            ) : (
              <input
                type="text"
                value={line.note ?? ""}
                onChange={(e) => onSetLineNote?.(line.id, e.target.value)}
                placeholder="Note"
                className="min-w-0 flex-1 rounded-lg border admin-shell-border bg-zinc-950/50 px-2 py-1 text-[10px] admin-shell-text outline-none placeholder:admin-surface-faint focus-ra-primary"
              />
            )}
          </div>

          {!compact ? (
            <input
              type="text"
              value={line.note ?? ""}
              onChange={(e) => onSetLineNote?.(line.id, e.target.value)}
              placeholder="Item note (e.g. less spicy)"
              className="mt-2 w-full rounded-lg border admin-shell-border bg-zinc-950/50 px-2.5 py-1.5 text-[11px] admin-shell-text outline-none placeholder:admin-surface-faint focus-ra-primary"
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}
