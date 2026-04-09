const styles = {
  pending:   "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 ring-red-500/40",
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
