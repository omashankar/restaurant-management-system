"use client";

import { Loader2, Shield } from "lucide-react";
import { raSpinnerCls } from "@/config/restaurantAdminTheme";
import { saSpinnerCls } from "@/config/superAdminTheme";

/**
 * Shared loader — dynamic theme for Super Admin and Restaurant Admin panels.
 */
export function BrandPreloaderFace({
  variant = "app",
  title,
  subtitle,
  compact = false,
}) {
  const isSuperAdmin = variant === "super-admin";
  const isAuth = variant === "auth";
  const isRestaurantAdmin = variant === "restaurant-admin" || variant === "app";

  const preloaderBox = isSuperAdmin
    ? "sa-preloader-box"
    : isAuth
      ? "auth-preloader-box"
      : "ra-preloader-box";
  const preloaderSpin = isSuperAdmin
    ? "sa-preloader-spin"
    : isAuth
      ? "auth-preloader-spin"
      : "ra-preloader-spin";
  const spinnerCls = isSuperAdmin ? saSpinnerCls : isAuth ? "auth-spinner size-4 animate-spin" : raSpinnerCls;
  const brandIconCls = isSuperAdmin ? "text-sa-primary" : isAuth ? "auth-link" : "text-ra-primary";

  const defaultTitle = isSuperAdmin
    ? "Super Admin Console"
    : "Restaurant Management System";
  const defaultSubtitle = isSuperAdmin
    ? "Loading Super Admin…"
    : isAuth
      ? "Please wait…"
      : "Loading your dashboard…";

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
        <Loader2 className={isSuperAdmin || isAuth || isRestaurantAdmin ? spinnerCls : "size-4 animate-spin text-zinc-400"} />
        <span>{subtitle ?? defaultSubtitle}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="relative">
        <div className={`size-14 rounded-2xl ${preloaderBox}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          {isSuperAdmin ? (
            <Shield className={`size-6 ${brandIconCls}`} />
          ) : (
            <div className={`size-7 animate-spin rounded-full border-2 ${preloaderSpin}`} />
          )}
        </div>
        {isSuperAdmin ? (
          <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-zinc-900 bg-zinc-950">
            <div className={`size-4 animate-spin rounded-full border-2 ${preloaderSpin}`} />
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-semibold tracking-wide text-zinc-100">
          {title ?? defaultTitle}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{subtitle ?? defaultSubtitle}</p>
      </div>
    </div>
  );
}
