"use client";

import { ITEM_TYPE_META } from "@/types/menu";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

const FALLBACK = "https://placehold.co/600x360/18181b/71717a?text=No+Image";

/** Short kitchen label so it fits in the badge row */
const KITCHEN_SHORT = {
  default_kitchen: null,          // don't show
  veg_kitchen:     "Veg Kitchen",
  non_veg_kitchen: "Non-Veg Kitchen",
};

/** Item type dot color for the indicator square on the card image */
const TYPE_BORDER = {
  veg:       "border-l-emerald-500",
  "non-veg": "border-l-red-500",
  drink:     "border-l-sky-500",
  egg:       "border-l-yellow-400",
  halal:     "border-l-teal-500",
  other:     "border-l-zinc-600",
};

export default function MenuProductCard({ item, onEdit, onDelete }) {
  const [imgOk, setImgOk] = useState(true);
  const src = item.image && imgOk ? item.image : FALLBACK;
  const typeMeta = item.itemType ? ITEM_TYPE_META[item.itemType] : null;
  const kitchenLabel = item.kitchenType ? KITCHEN_SHORT[item.kitchenType] : null;
  const accentBorder = item.itemType ? (TYPE_BORDER[item.itemType] ?? "border-l-zinc-700") : "border-l-zinc-700";

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 border-l-4 ${accentBorder} bg-zinc-900/70 shadow-lg shadow-black/25 transition-all duration-300 ease-out hover:z-10 hover:-translate-y-1 hover:border-emerald-500/35 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.99] ${
        item.status === "inactive" ? "opacity-70" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={() => setImgOk(false)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

        {/* Category chip — top left */}
        <span className="absolute left-3 top-3 rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30 backdrop-blur-sm">
          {item.categoryName}
        </span>

        {/* Status chip — top right */}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
            item.status === "active"
              ? "bg-emerald-500/90 text-zinc-950 ring-emerald-400/50"
              : "bg-zinc-800/95 text-zinc-400 ring-zinc-600"
          }`}
        >
          {item.status}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">

        {/* Name + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-50 transition-colors group-hover:text-emerald-100">
            {item.name}
          </h3>
          <span className="shrink-0 text-base font-bold tabular-nums text-emerald-400">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>

        {/* Meta badges row */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Item type */}
          {typeMeta && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${typeMeta.badge}`}>
              <span className={`size-1.5 shrink-0 rounded-full ${typeMeta.dot}`} aria-hidden />
              {typeMeta.label}
            </span>
          )}

          {/* Prep time */}
          {item.prepTime != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 ring-1 ring-zinc-700">
              <Clock className="size-2.5 shrink-0" aria-hidden />
              {item.prepTime} min
            </span>
          )}

          {/* Kitchen type — only non-default */}
          {kitchenLabel && (
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
              {kitchenLabel}
            </span>
          )}
        </div>

        {/* Special badge (Popular / Fresh / Chef pick) */}
        {item.badge && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
            {item.badge}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 border-t border-zinc-800/60 pt-3">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-2 text-xs font-semibold text-zinc-300 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-2 text-xs font-semibold text-zinc-400 transition-all duration-200 hover:border-red-500/45 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
