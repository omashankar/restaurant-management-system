import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/* ── GET /api/super-admin/restaurants ── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "all";
    const plan   = searchParams.get("plan")   ?? "all";

    const client = await clientPromise;
    const db     = client.db();

    const filter = {};
    if (status !== "all") filter.status = status;
    if (plan   !== "all") filter.plan   = plan;
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: "i" } },
        { ownerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const restaurants = await db.collection("restaurants")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Attach owner info
    const ownerIds = restaurants
      .map((r) => r.ownerId)
      .filter(Boolean);

    const owners = ownerIds.length
      ? await db.collection("users")
          .find({ _id: { $in: ownerIds } }, { projection: { name: 1, email: 1 } })
          .toArray()
      : [];

    const ownerMap = Object.fromEntries(owners.map((o) => [o._id.toString(), o]));

    return Response.json({
      success: true,
      restaurants: restaurants.map((r) => {
        const owner = r.ownerId ? ownerMap[r.ownerId.toString()] : null;
        return {
          id:         r._id.toString(),
          name:       r.name,
          ownerEmail: owner?.email ?? r.ownerEmail ?? "—",
          ownerName:  owner?.name  ?? "—",
          plan:       r.plan   ?? "free",
          status:     r.status ?? "active",
          createdAt:  r.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("GET restaurants error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── POST /api/super-admin/restaurants — create restaurant + owner account ── */
export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { name, ownerEmail, ownerName, ownerPassword, plan = "free" } = body;

  if (!name?.trim())        return Response.json({ success: false, error: "Restaurant name is required." }, { status: 400 });
  if (!ownerEmail?.trim())  return Response.json({ success: false, error: "Owner email is required." },     { status: 400 });
  if (!ownerPassword)       return Response.json({ success: false, error: "Owner password is required." },  { status: 400 });
  if (ownerPassword.length < 6) return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    // Duplicate email check
    const existingUser = await db.collection("users").findOne({ email: ownerEmail.toLowerCase().trim() });
    if (existingUser) {
      return Response.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    // Create restaurant first (get its _id as tenantId)
    const restaurantResult = await db.collection("restaurants").insertOne({
      name:       name.trim(),
      ownerEmail: ownerEmail.toLowerCase().trim(),
      plan,
      status:     "active",
      ownerId:    null, // will update after user insert
      createdAt:  new Date(),
    });

    const restaurantId = restaurantResult.insertedId;

    // Create owner user with restaurantId as tenantId
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    const userResult = await db.collection("users").insertOne({
      name:         (ownerName?.trim()) || ownerEmail.split("@")[0],
      email:        ownerEmail.toLowerCase().trim(),
      password:     hashedPassword,
      role:         "admin",
      restaurantId, // ← tenantId
      isVerified:   true,
      status:       "active",
      createdAt:    new Date(),
    });

    // Link owner to restaurant
    await db.collection("restaurants").updateOne(
      { _id: restaurantId },
      { $set: { ownerId: userResult.insertedId } }
    );

    return Response.json({
      success: true,
      restaurant: {
        id:         restaurantId.toString(),
        name:       name.trim(),
        ownerEmail: ownerEmail.toLowerCase().trim(),
        plan,
        status:     "active",
      },
    }, { status: 201 });

  } catch (err) {
    console.error("POST restaurant error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
