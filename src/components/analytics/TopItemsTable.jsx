"use client";

import PaginationBar from "@/components/ui/PaginationBar";
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
    <div className="admin-surface-card overflow-hidden">
      <div className="flex items-center gap-2 admin-surface-divider-b px-5 py-4">
        <Trophy className="size-4 text-amber-400" />
        <p className="text-sm font-semibold admin-shell-text">Top Items by Revenue</p>
      </div>
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
              <AdminTableTd className="px-5 font-medium admin-shell-text">{item.name}</AdminTableTd>
              <AdminTableTd align="right" className="px-5 admin-surface-body">{item.qty}</AdminTableTd>
              <AdminTableTd align="right" className="px-5 font-semibold text-ra-primary">
                {formatMoney(item.revenue)}
              </AdminTableTd>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </AdminTable>
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
  );
}
