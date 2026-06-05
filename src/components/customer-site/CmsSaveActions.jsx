"use client";

import { Loader2, Rocket, Save } from "lucide-react";

export default function CmsSaveActions({
  section,
  saving,
  onSaveDraft,
  onPublish,
  draftLabel = "Save to draft",
  publishLabel = "Publish now",
}) {
  const draftBusy = saving === `draft-${section}`;
  const pubBusy = saving === `pub-${section}`;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={!!saving}
        onClick={onSaveDraft}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-control)] px-4 py-2.5 text-sm font-semibold admin-shell-text transition-colors hover:bg-[var(--admin-hover)] disabled:opacity-50"
      >
        {draftBusy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {draftLabel}
      </button>
      <button
        type="button"
        disabled={!!saving}
        onClick={onPublish}
        className="inline-flex items-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 transition-colors"
      >
        {pubBusy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
        {publishLabel}
      </button>
    </div>
  );
}
