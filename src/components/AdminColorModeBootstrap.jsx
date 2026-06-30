import { adminThemeBootstrapScript } from "@/lib/adminThemeBootstrap";
import Script from "next/script";

/** Blocking restore of light/dark before hydration (all admin shells). */
export default function AdminColorModeBootstrap() {
  return (
    <Script id="admin-color-mode-bootstrap" strategy="beforeInteractive">
      {adminThemeBootstrapScript()}
    </Script>
  );
}
