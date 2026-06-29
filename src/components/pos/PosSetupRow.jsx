"use client";

import { ChevronRight } from "lucide-react";

export default function PosSetupRow({
  label,
  primary,
  secondary,
  actionLabel = "Change",
  onAction,
  onClear,
  disabled = false,
  error,
  icon: Icon,
}) {
  const isSet = Boolean(primary);

  return (
    <div className="py-3">
      <div className="flex items-center gap-2.5">
        {Icon ? (
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 sm:size-10 sm:rounded-xl ${
              isSet
                ? "bg-ra-primary/10 text-ra-primary ring-ra-primary/20"
                : "bg-[var(--admin-surface)] admin-surface-muted ring-[var(--admin-border-subtle)]"
            }`}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide admin-surface-faint">{label}</p>
          <p
            className={`mt-0.5 truncate text-sm font-semibold leading-tight ${
              isSet ? "text-ra-primary-muted" : "admin-surface-muted"
            }`}
          >
            {primary || "Not set"}
          </p>
          {secondary ? (
            <p
              className={`mt-0.5 line-clamp-2 text-[11px] leading-snug ${
                isSet ? "admin-surface-muted" : "text-amber-500/80"
              }`}
            >
              {secondary}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isSet && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled}
            onClick={onAction}
            className={`cursor-pointer inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              isSet
                ? "text-ra-primary hover:bg-ra-primary/10"
                : "bg-ra-primary text-zinc-950 shadow-sm hover:brightness-110"
            }`}
          >
            {actionLabel}
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
      {error ? <p className="mt-1.5 pl-11 text-[10px] text-red-400 sm:pl-12">{error}</p> : null}
    </div>
  );
}
