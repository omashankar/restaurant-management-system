import { superAdminThemeBootstrapScript } from "@/lib/superAdminThemeStorage";

/** Blocking Super Admin theme restore — prevents default-color flash on reload. */
export default function SuperAdminThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: superAdminThemeBootstrapScript() }}
    />
  );
}
