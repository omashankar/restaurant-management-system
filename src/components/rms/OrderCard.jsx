const statusStyles = {
  new: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  preparing: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  ready: "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25",
  completed: "bg-zinc-500/15 admin-surface-body ring-zinc-500/25",
};

export default function OrderCard({ order, onAction, className = "" }) {
  const badge = statusStyles[order.status] ?? statusStyles.completed;
  return (
    <div
      className={`admin-surface-card p-4 shadow-md shadow-black/15 transition-all duration-200 hover:border-zinc-700 hover:shadow-lg ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-sm text-ra-primary/90">{order.id}</p>
          <p className="text-sm admin-surface-muted">
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
        <span className="admin-surface-muted">{order.customer}</span>
        <span className="font-semibold admin-shell-text">
          ${order.total.toFixed(2)}
        </span>
      </div>
      <p className="mt-2 text-xs admin-surface-faint">{order.time}</p>
      {onAction ? (
        <button
          type="button"
          onClick={() => onAction(order)}
          className="mt-3 w-full rounded-xl border admin-shell-border py-2 text-sm font-medium admin-shell-text transition-colors hover:border-ra-primary-50 hover-bg-ra-primary-10 hover:text-ra-primary-muted"
        >
          View details
        </button>
      ) : null}
    </div>
  );
}
