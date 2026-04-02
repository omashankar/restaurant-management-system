import DataTableShell from "@/components/ui/DataTableShell";

export default function ReservationTableSkeleton() {
  return (
    <DataTableShell>
      <div className="min-w-[800px] space-y-0 p-4">
        <div className="mb-3 flex gap-3 border-b border-zinc-800 pb-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-3 flex-1 max-w-[100px] rounded bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="flex gap-3 border-b border-zinc-800/60 py-3">
            {Array.from({ length: 8 }).map((_, c) => (
              <div
                key={c}
                className="h-4 flex-1 rounded bg-zinc-800/70 animate-pulse"
                style={{ animationDelay: `${(r * 8 + c) * 40}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </DataTableShell>
  );
}
