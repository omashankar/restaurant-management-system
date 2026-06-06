"use client";

import DataTableShell from "@/components/ui/DataTableShell";
import PaginationBar from "@/components/ui/PaginationBar";
import { usePaginatedList } from "@/hooks/usePaginatedList";

export default function CustomerOrderHistoryTable({ orders = [] }) {
  const { page, setPage, pageRows, total, totalPages, pageSize } = usePaginatedList(orders, {
    searchKeys: ["id", "items", "date"],
    pageSize: 10,
  });

  return (
    <DataTableShell className="mt-4 min-w-0">
      {total === 0 ? (
        <div className="px-4 py-10 text-center text-sm admin-surface-muted">
          No orders yet.
        </div>
      ) : (
        <>
          <div className="space-y-2 p-3 md:hidden">
            {pageRows.map((o) => (
              <div
                key={o.id}
                className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-mono text-xs text-ra-primary/90">{o.id}</p>
                  <p className="shrink-0 font-medium tabular-nums admin-shell-text">
                    ${Number(o.total ?? 0).toFixed(2)}
                  </p>
                </div>
                <p className="mt-1 text-xs admin-surface-muted">{o.date}</p>
                <p className="mt-2 break-words text-sm admin-surface-body">{o.items}</p>
              </div>
            ))}
            <div className="px-1 pb-1">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                hideWhenSinglePage
              />
            </div>
          </div>

          <div className="hidden md:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b admin-shell-border admin-surface-card text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-[var(--admin-hover)]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ra-primary/90">{o.id}</td>
                    <td className="px-4 py-3 text-zinc-400">{o.date}</td>
                    <td className="max-w-[16rem] px-4 py-3 admin-surface-body lg:max-w-none">
                      <span className="line-clamp-2">{o.items}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums admin-shell-text">
                      ${Number(o.total ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                hideWhenSinglePage
              />
            </div>
          </div>
        </>
      )}
    </DataTableShell>
  );
}
