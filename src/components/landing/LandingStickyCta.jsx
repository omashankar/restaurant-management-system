"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "landing-sticky-cta-dismissed";

export default function LandingStickyCta({
  label = "Start Free Trial",
  href = "/signup",
  note = "14-day free trial · No card required",
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;

    const update = () => {
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight;
      const viewH = window.innerHeight;
      const nearBottom = y + viewH > docH - 220;
      const footer = document.getElementById("footer");
      const cta = document.getElementById("cta");
      let hideZone = nearBottom;

      for (const el of [footer, cta]) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top < viewH - 80) hideZone = true;
      }

      setVisible(y > 520 && !hideZone);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2 p-3 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
          <p className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-500 sm:truncate">
            {note}
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-colors hover:bg-indigo-500 sm:gap-1.5 sm:px-4"
        >
          <span className="hidden min-[360px]:inline">Join free</span>
          <span className="min-[360px]:hidden">Free</span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
