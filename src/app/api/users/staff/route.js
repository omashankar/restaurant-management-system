import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || !["admin", "manager"].includes(payload.role)) {
      return Response.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get admin's restaurantId
    const admin = await db.collection("users").findOne({ _id: new ObjectId(payload.id) });
    const restaurantId = admin?.restaurantId;

    const query = restaurantId
      ? { restaurantId, role: { $in: ["manager", "waiter", "chef"] } }
      : { role: { $in: ["manager", "waiter", "chef"] } };

    const staff = await db.collection("users")
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      staff: staff.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        role: s.role,
        phone: s.phone ?? "",
        status: s.status ?? "active",
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("Fetch staff error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
