export default function DataTableShell({ children, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-lg shadow-black/20 ${className}`}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
