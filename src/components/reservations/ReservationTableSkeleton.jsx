import TableSkeleton from "@/components/ui/TableSkeleton";

export default function ReservationTableSkeleton() {
  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="h-8 w-48 animate-pulse rounded-lg admin-progress-track" />

      <div className="space-y-2 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3"
          >
            <div className="flex justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded admin-progress-track" />
                <div className="h-3 w-1/2 rounded admin-progress-track" />
              </div>
              <div className="h-6 w-16 rounded-full admin-progress-track" />
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
