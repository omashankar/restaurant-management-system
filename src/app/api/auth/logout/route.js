import { clearRefreshTokenCookie, clearTokenCookie } from "@/lib/authCookies";

export async function POST() {
  const res = Response.json({ success: true });
  return clearRefreshTokenCookie(clearTokenCookie(res));
}
