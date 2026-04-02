"use client";

import { useApp } from "@/context/AppProviders";
import { useModuleData } from "@/context/ModuleDataContext";

export default function AppPreloader() {
  const { hydrated: appHydrated } = useApp();
  const { hydrated: moduleHydrated } = useModuleData();
  const ready = appHydrated && moduleHydrated;

  return (
    <div
      aria-hidden={ready}
      className={`pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/95 text-zinc-100 transition-opacity duration-500 ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div className="relative">
          <div className="size-14 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-900/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-7 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-zinc-100">
            Restaurant Management System
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}
