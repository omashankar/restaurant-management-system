import TableSkeleton from "@/components/ui/TableSkeleton";

export default function ReservationTableSkeleton() {
  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="h-8 w-44 animate-pulse rounded-lg admin-progress-track" />
        <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-40" />
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        <div className="h-10 w-full max-w-md animate-pulse rounded-xl admin-surface-card" />
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-44" />
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-36" />
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-32" />
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-40" />
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
          >
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded admin-progress-track" />
                <div className="h-3 w-1/2 rounded admin-progress-track" />
              </div>
              <div className="h-6 w-16 shrink-0 rounded-full admin-progress-track" />
            </div>
            <div className="mt-3 h-3 w-full rounded admin-progress-track" />
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <TableSkeleton rows={6} cols={9} />
      </div>
    </div>
  );
}
