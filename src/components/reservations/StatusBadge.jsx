const styles = {
  pending:   "bg-amber-500/15 text-amber-600 ring-amber-500/25",
  confirmed: "ra-status-badge",
  cancelled: "bg-red-500/15 text-red-500 ring-red-500/30",
  completed: "bg-sky-500/15 text-sky-600 ring-sky-500/25",
};

export default function StatusBadge({ status }) {
  const key = status ?? "pending";
  const cls = styles[key] ?? styles.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${cls}`}>
      {key}
    </span>
  );
}
