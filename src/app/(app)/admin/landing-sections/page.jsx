import { TOKEN_COOKIE } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Legacy URL — platform landing CMS lives under Super Admin. */
export default async function AdminLandingSectionsRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const payload = token ? verifyToken(token) : null;

  if (payload?.role === "super_admin") {
    redirect("/super-admin/landing-site");
  }

  redirect("/dashboard");
}
