"use client";

import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
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
    <div
      className={`flex flex-col items-stretch justify-between gap-3 border-t ${adminShell.borderT} pt-4 text-sm sm:flex-row sm:items-center`}
    >
      <p className={adminSurface.muted}>
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing{" "}
            <span className={`font-medium ${adminSurface.body}`}>
              {from}–{to}
            </span>{" "}
            of <span className={`font-medium ${adminSurface.body}`}>{total}</span>
          </>
        )}
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${adminSurface.btnGhost} py-1.5 text-sm disabled:opacity-35`}
        >
          <ChevronLeft className="size-4" />
          Prev
        </button>
        <span className={`px-2 text-xs tabular-nums ${adminSurface.faint}`}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${adminSurface.btnGhost} py-1.5 text-sm disabled:opacity-35`}
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
