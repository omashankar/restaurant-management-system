"use client";

import { usePlatformConfig } from "@/hooks/usePlatformConfig";

export default function DebugModeBanner() {
  const { config, loading } = usePlatformConfig();
  if (loading || !config.debugMode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-amber-500 px-3 py-1.5 text-center text-xs font-semibold text-amber-950">
      DEBUG MODE — Platform debug is ON in Super Admin settings
    </div>
  );
}
