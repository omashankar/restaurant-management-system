"use client";

import { ExternalLink, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LandingPreviewBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] border-b border-amber-400/40 bg-amber-50/95 px-3 py-2 backdrop-blur-sm sm:px-4"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center sm:justify-between sm:text-left">
        <p className="min-w-0 text-xs font-medium text-amber-950 sm:text-sm">
          <span className="font-semibold">Preview mode</span>
          <span className="hidden text-amber-900/80 sm:inline">
            {" "}
            — live site preview (dashboard redirect skipped)
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/super-admin/landing-site"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-100"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit content
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-500"
          >
            Live site
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex size-7 items-center justify-center rounded-full border border-amber-400/50 bg-white/80 text-amber-900 transition-colors hover:bg-amber-100"
            aria-label="Dismiss preview banner"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
