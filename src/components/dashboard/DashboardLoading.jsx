export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-52 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
        <div className="h-52 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
    </div>
  );
}
