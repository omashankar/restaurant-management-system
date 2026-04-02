const statusStyles = {
  new: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  preparing: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  ready: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  completed: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/25",
};

export default function OrderCard({ order, onAction, className = "" }) {
  const badge = statusStyles[order.status] ?? statusStyles.completed;
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-md shadow-black/15 transition-all duration-200 hover:border-zinc-700 hover:shadow-lg ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-sm text-emerald-400/90">{order.id}</p>
          <p className="text-sm text-zinc-400">
            Table {order.table} · {order.items} items
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ${badge}`}
        >
          {order.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-zinc-500">{order.customer}</span>
        <span className="font-semibold text-zinc-100">
          ${order.total.toFixed(2)}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-600">{order.time}</p>
      {onAction ? (
        <button
          type="button"
          onClick={() => onAction(order)}
          className="mt-3 w-full rounded-xl border border-zinc-700 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-200"
        >
          View details
        </button>
      ) : null}
    </div>
  );
}
