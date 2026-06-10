"use client";

import BhojDeskLogo from "@/components/brand/BhojDeskLogo";
import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import { FADE_MS, useLandingPreloadPhase } from "@/hooks/useLandingPreloadPhase";
import { usePathname } from "next/navigation";

/**
 * Marketing splash — same compact layout as Super Admin preloader (icon box + corner spinner).
 */
export default function LandingPreloader() {
  const pathname = usePathname();
  const isDark = pathname === "/maintenance";
  const phase = useLandingPreloadPhase();

  if (phase === "hidden") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={phase === "loading"}
      aria-label={`Loading ${BHOJDESK_BRAND.name}`}
      className={`landing-preloader fixed inset-0 z-[110] flex items-center justify-center transition-opacity ${
        isDark ? "landing-preloader--dark" : ""
      } ${phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div className="relative">
          <div
            className={`size-14 rounded-2xl landing-preloader-box ${
              isDark ? "landing-preloader-box--dark" : ""
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <BhojDeskLogo variant="icon" height={32} priority alt={BHOJDESK_BRAND.name} />
          </div>
          <div
            className={`absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border shadow-sm ${
              isDark ? "border-zinc-700 bg-zinc-900" : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`size-4 landing-preloader-spin ${
                isDark ? "landing-preloader-spin--dark" : ""
              }`}
              aria-hidden
            />
          </div>
        </div>
        <div>
          <p
            className={`text-sm font-semibold tracking-wide ${
              isDark ? "text-zinc-100" : "text-slate-900"
            }`}
          >
            {BHOJDESK_BRAND.name}
          </p>
          <p className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
            Loading…
          </p>
        </div>
      </div>
    </div>
  );
}
