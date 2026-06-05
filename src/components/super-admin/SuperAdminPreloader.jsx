"use client";

import { adminShell } from "@/config/adminSurfaceClasses";
import { BrandPreloaderFace } from "@/components/ui/BrandPreloaderFace";

export default function SuperAdminPreloader({
  message = "Loading Super Admin…",
  compact = false,
  className = "",
}) {
  if (compact) {
    return (
      <div className={`super-admin-panel ${className}`}>
        <BrandPreloaderFace variant="super-admin" subtitle={message} compact />
      </div>
    );
  }

  return (
    <div className={`super-admin-panel flex min-h-screen items-center justify-center ${adminShell.page} ${className}`}>
      <BrandPreloaderFace variant="super-admin" subtitle={message} />
    </div>
  );
}
