import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { getSubscription } from "@/lib/subscription";

export async function GET(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.id) return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  if (payload.role === "super_admin") return Response.json({ success: false, error: "Not applicable for super admin." }, { status: 400 });
  if (!payload.restaurantId) return Response.json({ success: false, error: "No restaurant associated." }, { status: 400 });

  try {
    const sub = await getSubscription(payload.restaurantId);
    if (!sub) {
      return Response.json({
        success: true,
        subscription: {
          planSlug: "free", planName: "Free", status: "active",
          price: 0, daysLeft: null, startDate: null, endDate: null,
          limits: { staff: 3, tables: 5, menuItems: 20, orders: 100 },
          features: [],
        },
      });
    }
    return Response.json({ success: true, subscription: sub });
  } catch (err) {
    console.error("GET /api/subscription error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
