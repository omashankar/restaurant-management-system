"use client";

import BhojDeskLogo from "@/components/brand/BhojDeskLogo";
import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import { Loader2 } from "lucide-react";
import { raSpinnerCls } from "@/config/restaurantAdminTheme";
import { saSpinnerCls } from "@/config/superAdminTheme";

/**
 * Shared loader — BhojDesk branding on Super Admin and Restaurant Admin panels.
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
  const isAdminPanel = isSuperAdmin || isRestaurantAdmin;

  const preloaderBox = isSuperAdmin
    ? "sa-preloader-box"
    : isAuth
      ? "auth-preloader-box"
      : "ra-preloader-box";
  const preloaderSpin = "admin-preloader-spin";
  const spinnerCls = isSuperAdmin
    ? `${saSpinnerCls} animate-spin`
    : isAuth
      ? "auth-spinner size-4 animate-spin"
      : `${raSpinnerCls} animate-spin`;

  const defaultTitle = isSuperAdmin
    ? BHOJDESK_BRAND.shortName
    : isRestaurantAdmin
      ? BHOJDESK_BRAND.name
      : BHOJDESK_BRAND.fullName;
  const defaultSubtitle = isSuperAdmin
    ? "Loading Super Admin…"
    : isAuth
      ? "Please wait…"
      : "Loading your dashboard…";

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm admin-shell-muted">
        <Loader2 className={isAdminPanel || isAuth ? spinnerCls : "size-4 animate-spin admin-shell-muted"} />
        <span>{subtitle ?? defaultSubtitle}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="relative">
        <div className={`size-14 rounded-2xl ${preloaderBox}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          {isAdminPanel ? (
            <BhojDeskLogo variant="icon" height={32} />
          ) : (
            <div className={`size-7 ${preloaderSpin}`} />
          )}
        </div>
        {isAdminPanel ? (
          <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border admin-shell-border admin-shell-elevated shadow-sm">
            <div className={`size-4 ${preloaderSpin}`} />
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-semibold tracking-wide admin-shell-text">
          {title ?? defaultTitle}
        </p>
        <p className="mt-1 text-xs admin-shell-muted">{subtitle ?? defaultSubtitle}</p>
      </div>
    </div>
  );
}
