"use client";

import PaginationBar from "@/components/ui/PaginationBar";
import DataTableShell from "@/components/ui/DataTableShell";
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  AdminTableHeadRow,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
} from "@/components/ui/AdminTable";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { Trophy } from "lucide-react";

export default function TopItemsTable({ items = [], formatMoney }) {
  const { page, setPage, pageRows, total, totalPages, pageSize } = usePaginatedList(items, {
    searchKeys: ["name"],
    pageSize: 10,
  });

  if (total === 0) return null;

  const startIndex = (page - 1) * pageSize;

  return (
    <div className="min-w-0 overflow-hidden admin-surface-card">
      <div className="flex items-center gap-2 admin-surface-divider-b px-4 py-3 sm:px-5 sm:py-4">
        <Trophy className="size-4 shrink-0 text-amber-400" />
        <p className="text-sm font-semibold admin-shell-text">Top Items by Revenue</p>
      </div>

      <div className="space-y-2 p-3 md:hidden">
        {pageRows.map((item, i) => (
          <div
            key={item.name}
            className="rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs admin-surface-muted">#{startIndex + i + 1}</p>
                <p className="mt-0.5 break-words font-medium admin-shell-text">{item.name}</p>
              </div>
              <p className="shrink-0 font-semibold text-ra-primary">{formatMoney(item.revenue)}</p>
            </div>
            <p className="mt-2 text-xs admin-surface-muted">
              Qty sold: <span className="font-medium admin-surface-body">{item.qty}</span>
            </p>
          </div>
        ))}
        <div className="pt-1">
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
        <DataTableShell>
          <AdminTable>
            <AdminTableHead>
              <AdminTableHeadRow>
                <AdminTableTh className="px-5">#</AdminTableTh>
                <AdminTableTh className="px-5">Item</AdminTableTh>
                <AdminTableTh align="right" className="px-5">Qty Sold</AdminTableTh>
                <AdminTableTh align="right" className="px-5">Revenue</AdminTableTh>
              </AdminTableHeadRow>
            </AdminTableHead>
            <AdminTableBody>
              {pageRows.map((item, i) => (
                <AdminTableRow key={item.name}>
                  <AdminTableTd className="px-5 font-mono text-xs admin-surface-muted">
                    {startIndex + i + 1}
                  </AdminTableTd>
                  <AdminTableTd className="max-w-[12rem] px-5 font-medium admin-shell-text sm:max-w-none">
                    <span className="block truncate">{item.name}</span>
                  </AdminTableTd>
                  <AdminTableTd align="right" className="px-5 admin-surface-body">{item.qty}</AdminTableTd>
                  <AdminTableTd align="right" className="px-5 font-semibold text-ra-primary">
                    {formatMoney(item.revenue)}
                  </AdminTableTd>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </DataTableShell>
        <div className="px-5 pb-4">
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
    </div>
  );
}
