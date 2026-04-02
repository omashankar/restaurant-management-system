import { Inbox } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-16 px-6 text-center transition-colors">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-500 ring-1 ring-zinc-700">
        <Inbox className="size-7" aria-hidden />
      </span>
      <p className="mt-4 text-base font-medium text-zinc-200">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-zinc-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
