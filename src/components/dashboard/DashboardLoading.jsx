export default function DashboardLoading() {
  const block =
    "animate-pulse admin-surface-card admin-surface-skeleton";
  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-800 admin-surface-skeleton" />
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-28 ${block}`} />
        ))}
      </div>
      <div className={`h-64 min-w-0 ${block}`} />
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`h-52 ${block}`} />
        <div className={`h-52 ${block}`} />
      </div>
      <div className={`h-72 min-w-0 ${block}`} />
    </div>
  );
}
