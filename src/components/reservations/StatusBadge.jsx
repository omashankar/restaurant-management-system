const styles = {
  pending:
    "bg-amber-500/15 text-amber-200 ring-amber-400/35 shadow-[0_0_12px_-4px_rgba(245,158,11,0.35)]",
  confirmed:
    "bg-emerald-500/15 text-emerald-200 ring-emerald-400/35 shadow-[0_0_12px_-4px_rgba(16,185,129,0.3)]",
  cancelled:
    "bg-red-500/15 text-red-200 ring-red-400/35 shadow-[0_0_12px_-4px_rgba(239,68,68,0.3)]",
};

export default function StatusBadge({ status }) {
  const key = status ?? "pending";
  const cls = styles[key] ?? styles.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ring-1 transition-all duration-200 ${cls}`}
    >
      {key}
    </span>
  );
}
