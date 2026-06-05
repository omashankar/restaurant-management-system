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
    <DataTableShell className="mt-4">
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
          {total === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-sm admin-surface-muted">
                No orders yet.
              </td>
            </tr>
          ) : (
            pageRows.map((o) => (
              <tr
                key={o.id}
                className="transition-colors hover:bg-[var(--admin-hover)]"
              >
                <td className="px-4 py-3 font-mono text-xs text-ra-primary/90">{o.id}</td>
                <td className="px-4 py-3 text-zinc-400">{o.date}</td>
                <td className="px-4 py-3 admin-surface-body">{o.items}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums admin-shell-text">
                  ${Number(o.total ?? 0).toFixed(2)}
                </td>
              </tr>
            ))
          )}
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
    </DataTableShell>
  );
}
