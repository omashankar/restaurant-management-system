export default function DashboardLoading() {
  const block =
    "animate-pulse admin-surface-card admin-surface-skeleton";
  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 size-10 shrink-0 animate-pulse rounded-xl admin-surface-card" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-44 max-w-full animate-pulse rounded-lg admin-surface-card sm:w-52" />
            <div className="h-4 w-full max-w-md animate-pulse rounded admin-surface-card" />
          </div>
        </div>
        <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-28" />
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-28 ${block}`} />
        ))}
      </div>
      <div className="grid min-w-0 items-stretch gap-4 sm:gap-6 lg:grid-cols-3">
        <div className={`order-2 h-72 min-w-0 lg:order-1 lg:col-span-2 ${block}`} />
        <div className={`order-1 h-56 min-w-0 lg:order-2 ${block}`} />
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-36 ${block}`} />
        ))}
      </div>
      <div className="grid min-w-0 items-stretch gap-6 lg:grid-cols-2">
        <div className={`h-52 min-w-0 ${block}`} />
        <div className={`h-52 min-w-0 ${block}`} />
      </div>
      <div className="grid min-w-0 items-stretch gap-4 sm:gap-6 lg:grid-cols-5">
        <div className={`h-64 min-w-0 lg:col-span-2 ${block}`} />
        <div className={`h-72 min-w-0 lg:col-span-3 ${block}`} />
      </div>
    </div>
  );
}
