import { customerThemeBootstrapScript } from "@/theme/customerBootstrap";
import Script from "next/script";

/**
 * Blocking restore of customer color mode from localStorage — reduces flash on reload.
 * Must render from the root Server Layout only (not inside client components).
 */
export default function CustomerThemeBootstrap() {
  return (
    <Script id="customer-theme-bootstrap" strategy="beforeInteractive">
      {customerThemeBootstrapScript()}
    </Script>
  );
}
