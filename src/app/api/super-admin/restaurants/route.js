import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { getPlatformSettings } from "@/lib/platformSettings";
import { validatePlatformPassword } from "@/lib/platformPassword";
import { notifyPlatformEvent } from "@/lib/platformNotify";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { parseSchema, superAdminRestaurantCreateSchema } from "@/lib/validationSchemas";

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

/** Search after owner $lookup — owner email lives on users, not restaurants. */
function buildSearchMatchStage(search) {
  if (!search) return null;
  const safeSearch = escapeRegex(search);
  return {
    $match: {
      $or: [
        { name: { $regex: safeSearch, $options: "i" } },
        { slug: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } },
        { "ownerDoc.email": { $regex: safeSearch, $options: "i" } },
        { "ownerDoc.name": { $regex: safeSearch, $options: "i" } },
      ],
    },
  };
}

async function aggregateRestaurantStats(db, matchFilter = {}) {
  const rows = await db.collection("restaurants").aggregate([
    ...(Object.keys(matchFilter).length ? [{ $match: matchFilter }] : []),
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).toArray();
  const countFor = (id) => (rows.find((x) => x._id === id)?.count ?? 0);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return {
    total,
    active:    countFor("active"),
    inactive:  countFor("inactive"),
    suspended: countFor("suspended"),
  };
}

async function ownerIdsMatchingSearch(db, search) {
  const safeSearch = escapeRegex(search);
  const owners = await db.collection("users").find(
    {
      role: "admin",
      $or: [
        { email: { $regex: safeSearch, $options: "i" } },
        { name: { $regex: safeSearch, $options: "i" } },
      ],
    },
    { projection: { _id: 1 } },
  ).toArray();
  return owners.map((o) => o._id);
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

      const searchStage = buildSearchMatchStage(search);
      if (searchStage) pipeline.push(searchStage);

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
          data: [{ $skip: skip }, { $limit: pageSize }],
        },
      });

      const [aggRow, stats] = await Promise.all([
        db.collection("restaurants").aggregate(pipeline).toArray().then((rows) => rows[0]),
        aggregateRestaurantStats(db),
      ]);
      const total = aggRow?.meta?.[0]?.total ?? 0;
      const rows = aggRow?.data ?? [];

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
          slug:       r.slug ?? null,
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

    const listFilter = { ...filter };
    if (search) {
      const safeSearch = escapeRegex(search);
      const ownerIds = await ownerIdsMatchingSearch(db, search);
      const orClauses = [
        { name: { $regex: safeSearch, $options: "i" } },
        { slug: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } },
      ];
      if (ownerIds.length) orClauses.push({ ownerId: { $in: ownerIds } });
      listFilter.$or = orClauses;
    }

    const restaurants = await db.collection("restaurants")
      .find(listFilter)
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
          slug:       r.slug ?? null,
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
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const cleanSlug = String(body?.slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").trim();

  let validated;
  try {
    validated = parseSchema(superAdminRestaurantCreateSchema, { ...body, slug: cleanSlug });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  const {
    name,
    ownerEmail,
    ownerName,
    ownerPassword,
    plan,
    phone,
    address,
    status,
    slug: validatedSlug,
  } = validated;
  const phoneStored = phone ? extractIndianMobileDigits(phone) : "";

  try {
    const client = await clientPromise;
    const db     = client.db();
    const platform = await getPlatformSettings(db);
    const pwdCheck = validatePlatformPassword(ownerPassword, platform.security);
    if (!pwdCheck.valid) {
      return Response.json({ success: false, error: pwdCheck.error }, { status: 400 });
    }

    // Duplicate email check
    const existingUser = await db.collection("users").findOne({ email: ownerEmail.toLowerCase().trim() });
    if (existingUser) {
      return Response.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const existingSlug = await db.collection("restaurants").findOne({ slug: validatedSlug });
    if (existingSlug) {
      return Response.json({
        success: false,
        error: "Yeh customer URL (slug) pehle se use ho raha hai. Koi aur slug choose karein.",
      }, { status: 409 });
    }

    const session = client.startSession();
    let restaurantId;
    let ownerId;

    try {
      await session.withTransaction(async () => {
        // Create restaurant first (get its _id as tenantId)
        const restaurantResult = await db.collection("restaurants").insertOne({
          name,
          slug:       validatedSlug,
          ownerEmail,
          phone:      phoneStored,
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
          email:        ownerEmail,
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

    await writeAuditLog({
      action: "restaurant.created",
      category: "restaurant",
      actorId: sa.id,
      targetId: restaurantId.toString(),
      targetName: name.trim(),
      meta: { plan, status },
      ip: getClientIp(request),
    });

    notifyPlatformEvent(db, {
      event: "restaurant.created",
      webhookData: { name: name.trim(), ownerEmail, plan, status },
      pushTitle: "Restaurant created",
      pushBody: name.trim(),
      emailType: "newRestaurant",
      emailContent: {
        subject: `[BhojDesk RMS] New restaurant: ${name.trim()}`,
        text: `Created by super admin.\nOwner: ${ownerEmail}\nPlan: ${plan}`,
      },
    }).catch(() => {});

    return Response.json({
      success: true,
      restaurant: {
        id:         restaurantId.toString(),
        ownerId:    ownerId.toString(),
        name,
        ownerEmail,
        ownerName:  (ownerName?.trim()) || ownerEmail.split("@")[0],
        ownerStatus: status === "active" ? "active" : "inactive",
        phone:      phoneStored,
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
