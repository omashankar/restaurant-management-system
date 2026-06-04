export default function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="admin-surface-table-shell">
      <div className="admin-table-list-header border-b admin-shell-border px-4 py-3">
        <div className="flex gap-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="h-3 flex-1 rounded admin-surface-skeleton animate-pulse"
              style={{ maxWidth: i === 0 ? "28%" : "14%" }}
            />
          ))}
        </div>
      </div>
      <div className="divide-y admin-shell-divider">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3 px-4 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 flex-1 rounded-md admin-surface-skeleton animate-pulse"
                style={{
                  animationDelay: `${(r * cols + c) * 40}ms`,
                  maxWidth: c === 0 ? "28%" : c === cols - 1 ? "18%" : "14%",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
