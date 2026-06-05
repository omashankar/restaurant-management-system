export default function DashboardLoading() {
  const block =
    "animate-pulse admin-surface-card admin-surface-skeleton";
  return (
    <div className="space-y-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-800 admin-surface-skeleton" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-28 ${block}`} />
        ))}
      </div>
      <div className={`h-64 ${block}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`h-52 ${block}`} />
        <div className={`h-52 ${block}`} />
      </div>
      <div className={`h-72 ${block}`} />
    </div>
  );
}
