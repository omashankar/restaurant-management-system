"use client";

import { customerThemeBootstrapScript } from "@/theme/customerBootstrap";
import { useServerInsertedHTML } from "next/navigation";

/** Blocking restore of customer color mode from localStorage — reduces flash on reload. */
export default function CustomerThemeBootstrap() {
  useServerInsertedHTML(() => (
    <script
      id="customer-theme-bootstrap"
      dangerouslySetInnerHTML={{ __html: customerThemeBootstrapScript() }}
    />
  ));
  return null;
}
