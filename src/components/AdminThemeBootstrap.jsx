import { adminThemeBootstrapScript } from "@/lib/adminThemeBootstrap";

/** Earliest restore — portal theme + light/dark before hydration (prevents loader flash). */
export default function AdminThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: adminThemeBootstrapScript() }}
    />
  );
}
