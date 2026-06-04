import { adminColorModeBootstrapScript } from "@/lib/adminColorMode";

/** Blocking restore of light/dark before hydration (all admin shells). */
export default function AdminColorModeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: adminColorModeBootstrapScript() }}
    />
  );
}
