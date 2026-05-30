"use client";

export default function CustomerSiteTabHeader({ tab, badge }) {
  if (!tab) return null;
  const Icon = tab.icon;
  return (
    <div className="mb-6 border-b border-zinc-800 pb-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-50">{tab.headline}</h2>
            {badge && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{tab.description}</p>
          {tab.pages?.length > 0 && (
            <p className="mt-2 text-xs text-zinc-600">
              <span className="font-medium text-zinc-500">Shows on: </span>
              {tab.pages.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
