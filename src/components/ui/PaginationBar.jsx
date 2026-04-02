"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-stretch justify-between gap-3 border-t border-zinc-800/80 pt-4 text-sm sm:flex-row sm:items-center">
      <p className="text-zinc-500">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-zinc-300">
              {from}–{to}
            </span>{" "}
            of <span className="font-medium text-zinc-300">{total}</span>
          </>
        )}
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-1.5 font-medium text-zinc-300 transition-all hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="size-4" />
          Prev
        </button>
        <span className="px-2 text-xs text-zinc-500 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-1.5 font-medium text-zinc-300 transition-all hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
