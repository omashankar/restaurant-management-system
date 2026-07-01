"use client";

import { superAdminThemeBootstrapScript } from "@/lib/superAdminThemeStorage";
import { useServerInsertedHTML } from "next/navigation";

/** Blocking Super Admin theme restore — prevents default-color flash on reload. */
export default function SuperAdminThemeBootstrap() {
  useServerInsertedHTML(() => (
    <script
      id="super-admin-theme-bootstrap"
      dangerouslySetInnerHTML={{ __html: superAdminThemeBootstrapScript() }}
    />
  ));
  return null;
}
