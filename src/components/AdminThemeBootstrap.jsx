"use client";

import { adminThemeBootstrapScript } from "@/lib/adminThemeBootstrap";
import { useServerInsertedHTML } from "next/navigation";

/** Earliest restore — portal theme + light/dark before hydration (prevents loader flash). */
export default function AdminThemeBootstrap() {
  useServerInsertedHTML(() => (
    <script
      id="admin-theme-bootstrap"
      dangerouslySetInnerHTML={{ __html: adminThemeBootstrapScript() }}
    />
  ));
  return null;
}
