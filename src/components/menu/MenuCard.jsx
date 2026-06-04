"use client";

/**
 * Unified menu card used in both POS and Menu Management.
 *
 * variant="pos"  → shows Add button, stock status, fast-item highlight
 * variant="menu" → shows Edit/Delete buttons, category chip, status badge
 */

import { ITEM_TYPE_META } from "@/types/menu";
import AdminFoodTypeIndicator from "@/components/menu/AdminFoodTypeIndicator";
import { Clock, Pencil, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";

// ── constants ────────────────────────────────────────────────────────────────

const FALLBACK = "https://placehold.co/600x360/18181b/52525b?text=No+Image";

const BORDER_ACCENT = {
  veg:       "border-l-emerald-500",
  "non-veg": "border-l-red-500",
  drink:     "border-l-sky-500",
  egg:       "border-l-yellow-400",
  halal:     "border-l-teal-500",
  other:     "border-l-zinc-600",
};

// stock status helpers (POS only)
function getStockStatus(item) {
  if (item.stock === 0 || item.status === "inactive") return "out";
  if (item.stock != null && item.stock <= 3) return "low";
  return "available";
}

const STOCK_META = {
  available: null, // no badge needed
  low:  { label: "Low Stock",    cls: "bg-amber-500/15 text-amber-400 ring-amber-500/25" },
  out:  { label: "Out of Stock", cls: "bg-red-500/15 text-red-400 ring-red-500/25" },
};

// ── component ────────────────────────────────────────────────────────────────

export default function MenuCard({
  item,
  variant = "pos",   // "pos" | "menu"
  // POS props
  onAdd,
  isPopping = false,
  // Menu props
  onEdit,
  onDelete,
}) {
  const [imgError, setImgError] = useState(false);
  if (!item) return null;

  const isPOS  = variant === "pos";
  const isMenu = variant === "menu";

  const imgSrc      = imgError || !item.image ? FALLBACK : item.image;
  const typeMeta    = item.itemType ? ITEM_TYPE_META[item.itemType] : null;
  const accentBorder = BORDER_ACCENT[item.itemType] ?? "border-l-zinc-700";
  const isFast      = item.prepTime != null && item.prepTime < 10;
  const stockStatus = isPOS ? getStockStatus(item) : null;
  const isDisabled  = stockStatus === "out";
  const stockMeta   = stockStatus ? STOCK_META[stockStatus] : null;

  return (
    <article
      className={[
        "group relative flex flex-col overflow-hidden rounded-2xl",
        "border admin-shell-border/80 border-l-[3px]", accentBorder,
        "bg-zinc-900 shadow-md shadow-black/30",
        "transition-all duration-200",
        isDisabled
          ? "opacity-50 grayscale-[40%] cursor-not-allowed"
          : "hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40 cursor-pointer",
        isPopping ? "ring-2 ring-ra-primary-40 ring-offset-1 ring-offset-zinc-950" : "",
        isMenu && item.status === "inactive" ? "opacity-60 grayscale-[25%]" : "",
      ].filter(Boolean).join(" ")}
      onClick={isPOS && !isDisabled ? () => onAdd(item) : undefined}
    >
      {/* ── Image ── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.name}
          className={`h-full w-full object-cover transition-transform duration-300 ${!isDisabled ? "group-hover:scale-[1.04]" : ""}`}
          onError={() => setImgError(true)}
        />
        <div className="menu-card-image-scrim pointer-events-none absolute inset-0" aria-hidden />

        {/* top-left: category (menu variant) */}
        {isMenu && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-zinc-950/75 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-ra-primary backdrop-blur-sm">
            {item.categoryName}
          </span>
        )}
        {/* top-right: status (menu) OR prep time (pos) */}
        {isMenu && (
          <span className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
            item.status === "active"
              ? "bg-ra-primary text-zinc-950"
              : "bg-zinc-800/90 text-zinc-500"
          }`}>
            {item.status}
          </span>
        )}
        {isPOS && item.prepTime != null && (
          <span className={`menu-card-image-badge absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
            isFast
              ? "bg-amber-500/90 text-zinc-950"
              : ""
          }`}>
            {isFast ? <Zap className="size-2.5 shrink-0" aria-hidden /> : <Clock className="size-2.5 shrink-0" aria-hidden />}
            {item.prepTime}m
          </span>
        )}

        {/* bottom: price overlay */}
        <span className="menu-card-image-badge menu-card-image-price absolute bottom-2 right-2 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums text-ra-primary">
          ${Number(item.price).toFixed(2)}
        </span>

        {/* POS: fast item glow */}
        {isPOS && isFast && !isDisabled && (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-amber-500/20" />
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">

        {/* Name */}
        <h3 className={`line-clamp-1 flex items-center gap-1.5 admin-surface-title text-sm font-semibold transition-colors ${!isDisabled ? "group-hover:text-white" : ""}`}>
          <AdminFoodTypeIndicator type={item.itemType} size={13} />
          {item.name}
        </h3>

        {/* Description — shown in both variants */}
        {item.description && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-500">{item.description}</p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Prep time (menu only) */}
          {isMenu && item.prepTime != null && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ring-1 ${
              isFast
                ? "bg-amber-500/15 text-amber-400 ring-amber-500/25"
                : "bg-zinc-800 text-zinc-400 ring-zinc-700/80"
            }`}>
              {isFast ? <Zap className="size-2.5 shrink-0" aria-hidden /> : <Clock className="size-2.5 shrink-0" aria-hidden />}
              {item.prepTime} min
            </span>
          )}

          {/* Special badge */}
          {item.badge && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-400 ring-1 ring-amber-500/25">
              {item.badge}
            </span>
          )}

          {/* Stock status (POS only) */}
          {isPOS && stockMeta && (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${stockMeta.cls}`}>
              {stockMeta.label}
            </span>
          )}
        </div>

        {/* ── Actions ── */}
        {isPOS ? (
          /* POS: big Add button */
          <button
            type="button"
            disabled={isDisabled}
            onClick={(e) => { e.stopPropagation(); if (!isDisabled) onAdd(item); }}
            className="cursor-pointer mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl bg-ra-primary py-2 text-xs font-bold text-zinc-950 shadow-ra-primary-glow transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Add ${item.name}`}
          >
            <Plus className="size-3.5" />
            Add to Order
          </button>
        ) : (
          /* Menu: Edit + Delete */
          <div className="mt-auto flex gap-1.5 pt-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="admin-surface-btn-ghost cursor-pointer flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all hover:border-[color-mix(in_srgb,var(--ra-primary)_40%,var(--admin-border))] hover:bg-[color-mix(in_srgb,var(--ra-primary)_8%,var(--admin-surface))] hover:text-ra-primary"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="admin-surface-btn-ghost cursor-pointer flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[var(--admin-text-muted)] transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
