import { superAdminThemeBootstrapScript } from "@/lib/superAdminThemeStorage";
import Script from "next/script";

/** Blocking Super Admin theme restore — prevents default-color flash on reload. */
export default function SuperAdminThemeBootstrap() {
  return (
    <Script id="super-admin-theme-bootstrap" strategy="beforeInteractive">
      {superAdminThemeBootstrapScript()}
    </Script>
  );
}
