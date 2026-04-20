"use client";
import { Settings } from "lucide-react";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25">
          <Settings className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">System configuration and preferences.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
        <p className="text-sm text-zinc-600">Coming soon — system settings.</p>
      </div>
    </div>
  );
}
