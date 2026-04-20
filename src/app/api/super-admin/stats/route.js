import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const token   = getTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;

    if (!payload || payload.role !== "super_admin") {
      return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    const client = await clientPromise;
    const db     = client.db();

    /* ── RBAC: super_admin stats scope is restaurants + admin users only.
       Staff (manager/waiter/chef) belong to their tenant — not visible here.
    ── */
    const [
      totalRestaurants,
      totalAdmins,
      activeAdmins,
      recentAdmins,
    ] = await Promise.all([
      db.collection("restaurants").countDocuments(),
      db.collection("users").countDocuments({ role: "admin" }),
      db.collection("users").countDocuments({ role: "admin", status: "active" }),
      db.collection("users")
        .find({ role: "admin" }, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray(),
    ]);

    return Response.json({
      success: true,
      stats: {
        totalRestaurants,
        totalAdmins,
        activeAdmins,
        inactiveAdmins: totalAdmins - activeAdmins,
      },
      recentUsers: recentAdmins.map((u) => ({
        id:        u._id.toString(),
        name:      u.name,
        email:     u.email,
        role:      u.role,
        status:    u.status ?? "active",
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("super-admin/stats error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
