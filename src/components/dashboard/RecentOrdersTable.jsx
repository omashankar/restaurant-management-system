import { adminSurface } from "@/config/adminSurfaceClasses";
import { formatAdminMoney } from "@/lib/adminCurrency";
import Link from "next/link";
import { Bike, ConciergeBell, Store } from "lucide-react";

const statusStyles = {
  new:       "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  preparing: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  ready:     "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25",
  completed: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
  cancelled: "bg-red-500/20 text-red-400 ring-red-500/40",
};

const typeIcon  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const typeLabel = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const paymentStatusStyles = {
  paid: "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25",
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

function getOrderFields(order) {
  const orderType = order.type ?? order.orderType;
  return {
    id: order.orderId ?? order.id,
    customer: order.customer ?? "—",
    TypeIcon: typeIcon[orderType] ?? Store,
    typeText: typeLabel[orderType] ?? "—",
    tableNumber: order.tableNumber && order.tableNumber !== "—" ? order.tableNumber : null,
    amount: order.amount ?? order.total ?? 0,
    status: order.status ?? "completed",
    paymentMethod: String(order.payment?.method ?? "cod"),
    paymentStatus: String(order.payment?.status ?? "pending"),
    time:
      order.time ??
      (order.createdAt
        ? new Date(order.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—"),
  };
}

function RecentOrderMobileCard({ order, currency }) {
  const {
    id,
    customer,
    TypeIcon,
    typeText,
    tableNumber,
    amount,
    status,
    paymentMethod,
    paymentStatus,
    time,
  } = getOrderFields(order);

  return (
    <article className="px-4 py-3.5 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-xs text-ra-primary/90" title={id}>
          {id}
        </p>
        <p className="shrink-0 text-sm font-semibold tabular-nums admin-shell-text">
          {formatAdminMoney(amount, currency, { decimals: 2 })}
        </p>
      </div>

      <p className="mt-1 break-words text-sm font-medium admin-shell-text">{customer}</p>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex min-w-0 items-center gap-1.5 text-xs ${adminSurface.muted}`}>
          <TypeIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="whitespace-nowrap">{typeText}</span>
          {tableNumber ? (
            <span className="whitespace-nowrap text-zinc-600">· {tableNumber}</span>
          ) : null}
        </span>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusStyles[status] ?? statusStyles.completed}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={`inline-flex min-w-0 items-center gap-1.5 ${adminSurface.muted}`}>
          <span className="whitespace-nowrap">{paymentMethodLabel[paymentMethod] ?? paymentMethod}</span>
          <span
            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${paymentStatusStyles[paymentStatus] ?? paymentStatusStyles.pending}`}
          >
            {paymentStatus}
          </span>
        </span>
        <span className="shrink-0 tabular-nums admin-surface-faint">{time}</span>
      </div>
    </article>
  );
}

export default function RecentOrdersTable({ orders = [], currency = "INR" }) {
  return (
    <div className="rms-dashboard-card rms-dashboard-card--lg flex h-full min-h-0 w-full flex-col admin-surface-table-shell">
      <div className="admin-table-list-header flex shrink-0 items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="admin-surface-title text-sm font-semibold">Recent Orders</h3>
          <p className="admin-surface-subheading">Latest transactions across all channels</p>
        </div>
        <Link href="/orders" className="shrink-0 text-xs font-medium text-ra-primary hover:text-ra-primary-muted">
          View all →
        </Link>
      </div>

      <div className="rms-dashboard-card__body min-h-0 flex-1">
        {orders.length === 0 ? (
          <div className={`flex min-h-[12rem] items-center justify-center px-5 py-12 text-center text-sm ${adminSurface.muted}`}>
            No orders yet.
          </div>
        ) : (
          <>
            <div className="admin-table-body md:hidden">
              {orders.map((order) => (
                <RecentOrderMobileCard key={order.id} order={order} currency={currency} />
              ))}
            </div>

            <div className="hidden min-h-0 overflow-x-auto md:block">
              <table className="admin-table min-w-[52rem] w-full text-left text-sm">
                <thead className="admin-table-head sticky top-0 z-[1] backdrop-blur-sm">
                  <tr className="admin-table-head-row">
                    <th className="admin-table-th whitespace-nowrap px-5 py-3 text-left">Order ID</th>
                    <th className="admin-table-th whitespace-nowrap px-5 py-3 text-left">Customer</th>
                    <th className="admin-table-th whitespace-nowrap px-5 py-3 text-left">Type / Table</th>
                    <th className="admin-table-th admin-table-th--right whitespace-nowrap px-5 py-3">Amount</th>
                    <th className="admin-table-th whitespace-nowrap px-5 py-3 text-left">Status</th>
                    <th className="admin-table-th whitespace-nowrap px-5 py-3 text-left">Payment</th>
                    <th className="admin-table-th admin-table-th--right whitespace-nowrap px-5 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const {
                      id,
                      customer,
                      TypeIcon,
                      typeText,
                      tableNumber,
                      amount,
                      status,
                      paymentMethod,
                      paymentStatus,
                      time,
                    } = getOrderFields(order);

                    return (
                      <tr key={order.id} className="transition-colors hover:bg-[var(--admin-hover)]">
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-ra-primary/90">{id}</td>
                        <td className="max-w-[10rem] truncate whitespace-nowrap px-5 py-3 font-medium admin-shell-text">
                          {customer}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 ${adminSurface.muted}`}>
                            <TypeIcon className="size-3.5 shrink-0" />
                            <span>{typeText}</span>
                            {tableNumber ? (
                              <span className="text-zinc-600">· {tableNumber}</span>
                            ) : null}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums admin-shell-text">
                          {formatAdminMoney(amount, currency, { decimals: 2 })}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusStyles[status] ?? statusStyles.completed}`}>
                            {status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs admin-surface-body">{paymentMethodLabel[paymentMethod] ?? paymentMethod}</span>
                            <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${paymentStatusStyles[paymentStatus] ?? paymentStatusStyles.pending}`}>
                              {paymentStatus}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-xs admin-surface-faint">{time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
