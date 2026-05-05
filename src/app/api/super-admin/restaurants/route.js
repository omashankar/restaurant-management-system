import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

const VALID_PLANS = ["free", "starter", "pro", "enterprise"];

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    if (search && search.length > 80) {
      return Response.json({ success: false, error: "Search query is too long." }, { status: 400 });
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name:       { $regex: safeSearch, $options: "i" } },
        { ownerEmail: { $regex: safeSearch, $options: "i" } },
        { phone:      { $regex: safeSearch, $options: "i" } },
      ];
    }

    const pageRaw = searchParams.get("page");
    const usePagination = pageRaw != null && pageRaw !== "";

    if (usePagination) {
      const page = Math.max(1, parseInt(pageRaw, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10));
      const ownerStatus = searchParams.get("ownerStatus") ?? "all";
      const skip = (page - 1) * pageSize;

      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "users",
            localField: "ownerId",
            foreignField: "_id",
            as: "_ownerArr",
          },
        },
        { $addFields: { ownerDoc: { $arrayElemAt: ["$_ownerArr", 0] } } },
        { $project: { _ownerArr: 0 } },
      ];

      if (ownerStatus !== "all") {
        pipeline.push({
          $match: {
            $expr: {
              $eq: [{ $ifNull: ["$ownerDoc.status", "inactive"] }, ownerStatus],
            },
          },
        });
      }

      pipeline.push({ $sort: { createdAt: -1 } });
      pipeline.push({
        $facet: {
          meta: [{ $count: "total" }],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          data: [{ $skip: skip }, { $limit: pageSize }],
        },
      });

      const [aggRow] = await db.collection("restaurants").aggregate(pipeline).toArray();
      const total = aggRow?.meta?.[0]?.total ?? 0;
      const byStatus = aggRow?.byStatus ?? [];
      const rows = aggRow?.data ?? [];

      const countFor = (id) => (byStatus.find((x) => x._id === id)?.count ?? 0);
      const stats = {
        total,
        active:    countFor("active"),
        inactive:  countFor("inactive"),
        suspended: countFor("suspended"),
      };

      const restaurantIds = rows.map((r) => r._id);
      const roleCountsAgg = restaurantIds.length
        ? await db.collection("users").aggregate([
            { $match: { restaurantId: { $in: restaurantIds } } },
            {
              $group: {
                _id: { restaurantId: "$restaurantId", role: "$role" },
                count: { $sum: 1 },
              },
            },
          ]).toArray()
        : [];
      const roleCountMap = {};
      for (const row of roleCountsAgg) {
        const restaurantId = row?._id?.restaurantId?.toString?.();
        const role = row?._id?.role;
        if (!restaurantId || !role) continue;
        if (!roleCountMap[restaurantId]) roleCountMap[restaurantId] = {};
        roleCountMap[restaurantId][role] = row.count;
      }

      const restaurants = rows.map((r) => {
        const owner = r.ownerDoc ?? null;
        return {
          id:         r._id.toString(),
          ownerId:    r.ownerId?.toString() ?? null,
          name:       r.name,
          ownerEmail: owner?.email ?? r.ownerEmail ?? "—",
          ownerName:  owner?.name  ?? "—",
          ownerStatus: owner?.status ?? "inactive",
          phone:      r.phone      ?? "—",
          address:    r.address    ?? "",
          plan:       r.plan       ?? "free",
          status:     r.status     ?? "active",
          createdAt:  r.createdAt,
          roleCounts: {
            admin:   roleCountMap[r._id.toString()]?.admin   ?? 0,
            manager: roleCountMap[r._id.toString()]?.manager ?? 0,
            waiter:  roleCountMap[r._id.toString()]?.waiter  ?? 0,
            chef:    roleCountMap[r._id.toString()]?.chef    ?? 0,
          },
        };
      });

      return Response.json({
        success: true,
        restaurants,
        total,
        page,
        pageSize,
        stats,
      });
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
          .find({ _id: { $in: ownerIds } }, { projection: { name: 1, email: 1, status: 1 } })
          .toArray()
      : [];

    const ownerMap = Object.fromEntries(owners.map((o) => [o._id.toString(), o]));

    const restaurantIds = restaurants.map((r) => r._id);
    const roleCountsAgg = restaurantIds.length
      ? await db.collection("users").aggregate([
          { $match: { restaurantId: { $in: restaurantIds } } },
          {
            $group: {
              _id: { restaurantId: "$restaurantId", role: "$role" },
              count: { $sum: 1 },
            },
          },
        ]).toArray()
      : [];
    const roleCountMap = {};
    for (const row of roleCountsAgg) {
      const restaurantId = row?._id?.restaurantId?.toString?.();
      const role = row?._id?.role;
      if (!restaurantId || !role) continue;
      if (!roleCountMap[restaurantId]) roleCountMap[restaurantId] = {};
      roleCountMap[restaurantId][role] = row.count;
    }

    return Response.json({
      success: true,
      restaurants: restaurants.map((r) => {
        const owner = r.ownerId ? ownerMap[r.ownerId.toString()] : null;
        return {
          id:         r._id.toString(),
          ownerId:    r.ownerId?.toString() ?? null,
          name:       r.name,
          ownerEmail: owner?.email ?? r.ownerEmail ?? "—",
          ownerName:  owner?.name  ?? "—",
          ownerStatus: owner?.status ?? "inactive",
          phone:      r.phone      ?? "—",
          address:    r.address    ?? "",
          plan:       r.plan       ?? "free",
          status:     r.status     ?? "active",
          createdAt:  r.createdAt,
          roleCounts: {
            admin: roleCountMap[r._id.toString()]?.admin ?? 0,
            manager: roleCountMap[r._id.toString()]?.manager ?? 0,
            waiter: roleCountMap[r._id.toString()]?.waiter ?? 0,
            chef: roleCountMap[r._id.toString()]?.chef ?? 0,
          },
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

  const { name, ownerEmail, ownerName, ownerPassword, plan = "free", phone = "", address = "", status = "active" } = body;
  const allowedStatuses = ["active", "inactive", "suspended"];

  if (!name?.trim())        return Response.json({ success: false, error: "Restaurant name is required." }, { status: 400 });
  if (!ownerEmail?.trim())  return Response.json({ success: false, error: "Owner email is required." },     { status: 400 });
  if (!ownerPassword)       return Response.json({ success: false, error: "Owner password is required." },  { status: 400 });
  if (ownerPassword.length < 6) return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
  if (!allowedStatuses.includes(status)) return Response.json({ success: false, error: "Invalid status." }, { status: 400 });
  if (!VALID_PLANS.includes(plan)) return Response.json({ success: false, error: "Invalid plan." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    // Duplicate email check
    const existingUser = await db.collection("users").findOne({ email: ownerEmail.toLowerCase().trim() });
    if (existingUser) {
      return Response.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const session = client.startSession();
    let restaurantId;
    let ownerId;

    try {
      await session.withTransaction(async () => {
        // Create restaurant first (get its _id as tenantId)
        const restaurantResult = await db.collection("restaurants").insertOne({
          name:       name.trim(),
          ownerEmail: ownerEmail.toLowerCase().trim(),
          phone:      phone?.trim() ?? "",
          address:    address?.trim() ?? "",
          plan,
          status,
          ownerId:    null,
          createdAt:  new Date(),
        }, { session });

        restaurantId = restaurantResult.insertedId;

        // Create owner user with restaurantId as tenantId
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);
        const userResult = await db.collection("users").insertOne({
          name:         (ownerName?.trim()) || ownerEmail.split("@")[0],
          email:        ownerEmail.toLowerCase().trim(),
          password:     hashedPassword,
          role:         "admin",
          restaurantId, // ← tenantId
          isVerified:   true,
          status:       status === "active" ? "active" : "inactive",
          createdAt:    new Date(),
        }, { session });

        ownerId = userResult.insertedId;

        // Link owner to restaurant
        await db.collection("restaurants").updateOne(
          { _id: restaurantId },
          { $set: { ownerId } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return Response.json({
      success: true,
      restaurant: {
        id:         restaurantId.toString(),
        ownerId:    ownerId.toString(),
        name:       name.trim(),
        ownerEmail: ownerEmail.toLowerCase().trim(),
        ownerName:  (ownerName?.trim()) || ownerEmail.split("@")[0],
        ownerStatus: status === "active" ? "active" : "inactive",
        phone:      phone?.trim() ?? "",
        address:    address?.trim() ?? "",
        plan,
        status,
        createdAt:  new Date(),
        roleCounts: {
          admin: 1,
          manager: 0,
          waiter: 0,
          chef: 0,
        },
      },
    }, { status: 201 });

  } catch (err) {
    console.error("POST restaurant error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
