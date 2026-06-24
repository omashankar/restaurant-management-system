import { customerThemeBootstrapScript } from "@/theme/customerBootstrap";

/**
 * Blocking restore of customer color mode from localStorage — reduces flash on reload.
 * Must render from the root Server Layout `<head>` only (not inside client components).
 */
export default function CustomerThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: customerThemeBootstrapScript() }}
    />
  );
}
