import { clearCustomerTokenCookie } from "@/lib/customerAuth";

export async function POST() {
  const res = Response.json({ success: true });
  return clearCustomerTokenCookie(res);
}
