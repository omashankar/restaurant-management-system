"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function MenuItemCard({ item, onAdd, isPopping }) {
  const [imgError, setImgError] = useState(false);
  const fallbackSrc = "/food-placeholder.svg";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-lg hover:shadow-emerald-500/10 ${
        isPopping ? "ring-2 ring-emerald-500/50" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imgError ? fallbackSrc : item.image}
          alt={item.name}
          fill
          unoptimized={!imgError}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
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
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-95"
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
