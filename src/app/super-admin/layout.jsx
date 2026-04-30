import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import { TOKEN_COOKIE } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SuperAdminRouteLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value ?? null;
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") {
    redirect("/login");
  }
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
