import { customerThemeBootstrapScript } from "@/theme/customerBootstrap";

/** Blocking restore of customer color mode from localStorage — reduces flash on reload. */
export default function CustomerThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: customerThemeBootstrapScript() }}
    />
  );
}
