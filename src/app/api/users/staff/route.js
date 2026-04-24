import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/* ── GET /api/users/staff
   Admin: returns staff scoped to their restaurantId (tenant isolation).
   Manager: returns staff scoped to their restaurantId.
   Super Admin: BLOCKED — staff is not in super_admin scope.
── */
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return Response.json({ success: false, error: "Invalid token." }, { status: 401 });

    /* Super Admin must NOT access staff endpoints */
    if (payload.role === "super_admin") {
      return Response.json(
        { success: false, error: "Super Admin does not manage staff. Use the restaurant admin account." },
        { status: 403 }
      );
    }

    if (!["admin", "manager"].includes(payload.role)) {
      return Response.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();

    /* Resolve restaurantId from JWT or DB lookup */
    let restaurantId = payload.restaurantId
      ? new ObjectId(payload.restaurantId)
      : null;

    if (!restaurantId) {
      const caller = await db.collection("users").findOne({ _id: new ObjectId(payload.id) });
      restaurantId = caller?.restaurantId ?? null;
    }

    if (!restaurantId) {
      return Response.json({ success: false, error: "No restaurant associated with this account." }, { status: 400 });
    }

    /* Tenant-scoped staff query */
    const staff = await db.collection("users")
      .find(
        { restaurantId, role: { $in: ["manager", "waiter", "chef"] } },
        { projection: { password: 0 } }
      )
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      staff: staff.map((s) => ({
        id:        s._id.toString(),
        name:      s.name,
        email:     s.email,
        role:      s.role,
        phone:     s.phone ?? "",
        status:    s.status ?? "active",
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("Fetch staff error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
