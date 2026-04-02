"use client";

import { Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";

const FALLBACK =
  "https://placehold.co/600x360/18181b/71717a?text=Menu+item";

/**
 * POS-style menu tile with image, badges, and actions.
 */
export default function MenuProductCard({ item, onEdit, onDelete }) {
  const [imgOk, setImgOk] = useState(true);
  const src = item.image && imgOk ? item.image : FALLBACK;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg shadow-black/25 transition-all duration-300 ease-out hover:z-10 hover:-translate-y-1 hover:border-emerald-500/35 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.99] ${
        item.status === "inactive" ? "opacity-85" : ""
      }`}
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={() => setImgOk(false)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-md bg-zinc-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30 backdrop-blur-sm">
          {item.categoryName}
        </span>
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

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-50 transition-colors group-hover:text-emerald-100">
            {item.name}
          </h3>
          <span className="shrink-0 text-lg font-bold tabular-nums text-emerald-400">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>
        {item.badge ? (
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-400/90">
            {item.badge}
          </p>
        ) : (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-600">
            <UtensilsCrossed className="size-3" aria-hidden />
            <span>Kitchen ready</span>
          </div>
        )}

        <div className="mt-auto flex gap-2 border-t border-zinc-800/80 pt-4">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-2 text-xs font-semibold text-zinc-300 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-2 text-xs font-semibold text-zinc-400 transition-all duration-200 hover:border-red-500/45 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
