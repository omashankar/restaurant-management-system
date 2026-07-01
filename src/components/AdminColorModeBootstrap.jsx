"use client";

import { adminThemeBootstrapScript } from "@/lib/adminThemeBootstrap";
import { useServerInsertedHTML } from "next/navigation";

/** Blocking restore of light/dark before hydration (all admin shells). */
export default function AdminColorModeBootstrap() {
  useServerInsertedHTML(() => (
    <script
      id="admin-color-mode-bootstrap"
      dangerouslySetInnerHTML={{ __html: adminThemeBootstrapScript() }}
    />
  ));
  return null;
}
