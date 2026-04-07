"use client";

import { ITEM_TYPE_META } from "@/types/menu";
import { Clock, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/** Left-edge accent color per item type */
const BORDER_ACCENT = {
  veg:       "border-l-emerald-500",
  "non-veg": "border-l-red-500",
  drink:     "border-l-sky-500",
  egg:       "border-l-yellow-400",
  halal:     "border-l-teal-500",
  other:     "border-l-zinc-600",
};

export default function MenuItemCard({ item, onAdd, isPopping }) {
  const [imgError, setImgError] = useState(false);
  const fallbackSrc = "/food-placeholder.svg";

  if (!item) return null;

  const typeMeta = item.itemType ? ITEM_TYPE_META[item.itemType] : null;
  const accentBorder = item.itemType ? BORDER_ACCENT[item.itemType] : "border-l-zinc-700";
  const imgSrc = imgError || !item.image ? fallbackSrc : item.image;

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-zinc-800 border-l-4 ${accentBorder} bg-zinc-900/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
        isPopping ? "ring-2 ring-emerald-500/50" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imgSrc}
          alt={item.name}
          fill
          unoptimized={!imgError}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        {/* Item type badge */}
        {typeMeta && (
          <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 backdrop-blur-sm ${typeMeta.badge}`}>
            <span className={`size-1.5 rounded-full ${typeMeta.dot}`} aria-hidden />
            {typeMeta.label}
          </span>
        )}
        {/* Prep time badge */}
        {item.prepTime != null && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-zinc-950/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 ring-1 ring-zinc-700 backdrop-blur-sm">
            <Clock className="size-2.5" aria-hidden />
            {item.prepTime}m
          </span>
        )}
      </div>

      <div className="space-y-2 p-3">
        <p className="truncate font-medium text-zinc-100">{item.name}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-emerald-400">
            ${item.price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-95"
            aria-label={`Add ${item.name}`}
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
