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
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <Filter className="size-4 shrink-0 text-zinc-500" aria-hidden />

      {/* Date range */}
      <div className="flex flex-wrap gap-1">
        {DATE_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setDateRange(r)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              dateRange === r
                ? "bg-emerald-500 text-zinc-950"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
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
        className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/40"
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
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="size-3.5" />
          CSV
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={!canExport}
          title={!canExport ? "Export requires admin access" : undefined}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-indigo-500/40 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="size-3.5" />
          PDF
        </button>
      </div>
    </div>
  );
}
