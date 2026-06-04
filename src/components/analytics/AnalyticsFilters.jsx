"use client";

import { Download, Filter } from "lucide-react";

const DATE_RANGES = ["Today", "This Week", "This Month", "This Year"];
const ORDER_TYPES = ["All", "Dine-In", "Takeaway", "Delivery"];

export default function AnalyticsFilters({ dateRange, setDateRange, orderType, setOrderType, canExport = true }) {
  const handleExportCSV = () => {
    alert("CSV export — connect to backend service.");
  };
  const handleExportPDF = () => {
    alert("PDF export — connect to backend service.");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border admin-shell-border bg-zinc-900/50 px-4 py-3">
      <Filter className="size-4 shrink-0 admin-surface-muted" aria-hidden />

      {/* Date range */}
      <div className="flex flex-wrap gap-1">
        {DATE_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setDateRange(r)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              dateRange === r
                ? "bg-ra-primary text-zinc-950"
                : "bg-zinc-800 admin-surface-muted hover:admin-shell-text"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-zinc-700" aria-hidden />

      {/* Order type */}
      <select
        value={orderType}
        onChange={(e) => setOrderType(e.target.value)}
        className="rounded-xl border admin-shell-border bg-zinc-900 px-3 py-1.5 text-xs admin-shell-text outline-none focus-ra-primary"
      >
        {ORDER_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Export */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={!canExport}
          title={!canExport ? "Export requires admin access" : undefined}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border admin-shell-border px-3 py-1.5 text-xs font-semibold admin-surface-body transition-colors hover-border-ra-primary-40 hover-ra-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="size-3.5" />
          CSV
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={!canExport}
          title={!canExport ? "Export requires admin access" : undefined}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border admin-shell-border px-3 py-1.5 text-xs font-semibold admin-surface-body transition-colors hover:border-indigo-500/40 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="size-3.5" />
          PDF
        </button>
      </div>
    </div>
  );
}
