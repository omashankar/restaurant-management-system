import { formatAdminMoney } from "@/lib/adminCurrency";
import Link from "next/link";
import { Bike, ConciergeBell, Store } from "lucide-react";

const statusStyles = {
  new:       "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  preparing: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  ready:     "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  completed: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  cancelled: "bg-red-500/20 text-red-400 ring-red-500/40",
};

const typeIcon  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const typeLabel = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const paymentStatusStyles = {
  paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  pending: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  initiated: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  processing: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/25",
  failed: "bg-red-500/20 text-red-400 ring-red-500/40",
};
const paymentMethodLabel = {
  cod: "COD",
  cashCounter: "Cash Counter",
  upi: "UPI",
  card: "Card",
  netBanking: "Net Banking",
  wallet: "Wallet",
  payLater: "Pay Later",
  bankTransfer: "Bank Transfer",
};

export default function RecentOrdersTable({ orders = [], currency = "INR" }) {
  return (
    <div className="rms-dashboard-card rms-dashboard-card--lg flex h-full min-h-0 w-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-lg shadow-black/20">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Recent Orders</h3>
          <p className="text-xs text-zinc-500">Latest transactions across all channels</p>
        </div>
        <Link href="/orders" className="shrink-0 text-xs font-medium text-emerald-400 hover:text-emerald-300">
          View all →
        </Link>
      </div>

      <div className="rms-dashboard-card__body min-h-0 flex-1">
        {orders.length === 0 ? (
          <div className="flex min-h-[12rem] items-center justify-center px-5 py-12 text-center text-sm text-zinc-600">
            No orders yet.
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-[1] bg-zinc-950/95 backdrop-blur-sm">
              <tr className="border-b border-zinc-800/80 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Type / Table</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {orders.map((o) => {
                const TypeIcon = typeIcon[o.type ?? o.orderType] ?? Store;
                const amount = o.amount ?? o.total ?? 0;
                const time = o.time ?? (o.createdAt ? new Date(o.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—");
                const paymentMethod = String(o.payment?.method ?? "cod");
                const paymentStatus = String(o.payment?.status ?? "pending");
                return (
                  <tr key={o.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-5 py-3 font-mono text-xs text-emerald-400/90">{o.orderId ?? o.id}</td>
                    <td className="px-5 py-3 font-medium text-zinc-200">{o.customer}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-zinc-400">
                        <TypeIcon className="size-3.5 shrink-0" />
                        <span>{typeLabel[o.type ?? o.orderType] ?? "—"}</span>
                        {o.tableNumber && o.tableNumber !== "—" && (
                          <span className="text-zinc-600">· {o.tableNumber}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-zinc-100">
                      {formatAdminMoney(amount, currency, { decimals: 2 })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusStyles[o.status] ?? statusStyles.completed}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-300">{paymentMethodLabel[paymentMethod] ?? paymentMethod}</span>
                        <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${paymentStatusStyles[paymentStatus] ?? paymentStatusStyles.pending}`}>
                          {paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-zinc-600">{time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
