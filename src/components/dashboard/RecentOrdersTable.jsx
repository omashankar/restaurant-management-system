import { recentOrdersTable } from "@/lib/mockData";
import Link from "next/link";
import { Bike, ConciergeBell, Store } from "lucide-react";

const statusStyles = {
  new: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  preparing: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  ready: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  completed: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  cancelled: "bg-red-500/15 text-red-400 ring-red-500/25",
};

const typeIcon = {
  "dine-in": Store,
  takeaway: ConciergeBell,
  delivery: Bike,
};

const typeLabel = {
  "dine-in": "Dine-In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export default function RecentOrdersTable() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Recent Orders</h3>
          <p className="text-xs text-zinc-500">Latest transactions across all channels</p>
        </div>
        <Link
          href="/orders"
          className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3">Order ID</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Type / Table</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {recentOrdersTable.map((o) => {
              const TypeIcon = typeIcon[o.type] ?? Store;
              return (
                <tr key={o.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="px-5 py-3 font-mono text-xs text-emerald-400/90">{o.id}</td>
                  <td className="px-5 py-3 font-medium text-zinc-200">{o.customer}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      <TypeIcon className="size-3.5 shrink-0" aria-hidden />
                      <span>{typeLabel[o.type]}</span>
                      {o.table !== "—" && (
                        <span className="text-zinc-600">· {o.table}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-zinc-100">
                    ${o.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
                        statusStyles[o.status] ?? statusStyles.completed
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-zinc-600">{o.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
