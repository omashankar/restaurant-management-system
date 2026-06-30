import { adminThemeBootstrapScript } from "@/lib/adminThemeBootstrap";
import Script from "next/script";

/** Earliest restore — portal theme + light/dark before hydration (prevents loader flash). */
export default function AdminThemeBootstrap() {
  return (
    <Script id="admin-theme-bootstrap" strategy="beforeInteractive">
      {adminThemeBootstrapScript()}
    </Script>
  );
}
