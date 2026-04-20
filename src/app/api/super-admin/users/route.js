import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/* ── GET /api/super-admin/users
   Super Admin can ONLY see restaurant admins (role === "admin").
   Staff roles (manager, waiter, chef) are managed by their own admin
   and are never exposed to the super_admin layer.
── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "all";

    const client = await clientPromise;
    const db     = client.db();

    /* ── RBAC: super_admin sees ONLY role === "admin" ── */
    const filter = { role: "admin" };
    if (status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await db.collection("users")
      .find(filter, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    // Attach restaurant names
    const restaurantIds = [...new Set(
      users.map((u) => u.restaurantId?.toString()).filter(Boolean)
    )];

    let restaurantMap = {};
    if (restaurantIds.length) {
      const restaurants = await db.collection("restaurants")
        .find(
          { _id: { $in: restaurantIds.map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) } },
          { projection: { name: 1 } }
        )
        .toArray();
      restaurantMap = Object.fromEntries(restaurants.map((r) => [r._id.toString(), r.name]));
    }

    return Response.json({
      success: true,
      users: users.map((u) => ({
        id:             u._id.toString(),
        name:           u.name,
        email:          u.email,
        role:           u.role,
        status:         u.status ?? "active",
        restaurantId:   u.restaurantId?.toString() ?? null,
        restaurantName: u.restaurantId ? (restaurantMap[u.restaurantId.toString()] ?? "Unknown") : "—",
        createdAt:      u.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET super-admin/users error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
