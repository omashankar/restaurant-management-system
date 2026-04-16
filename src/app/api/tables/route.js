import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

/* GET /api/tables?areaId=xxx&status=available */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request) => {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get("areaId");
    const status = searchParams.get("status");

    const filter = { ...tenantFilter };
    if (areaId)                    filter.categoryId = areaId;
    if (status && status !== "all") filter.status     = status;

    const tables = await db.collection("tables")
      .find(filter)
      .sort({ tableNumber: 1 })
      .toArray();

    return Response.json({
      success: true,
      tables: tables.map((t) => ({ ...t, id: t._id.toString(), _id: undefined })),
    });
  }
);

/* POST /api/tables */
export const POST = withTenant(
  ["admin"],
  async ({ db, tenantFilter, payload }, request) => {
    const { tableNumber, capacity, status, categoryId, zone } = await request.json();
    if (!tableNumber?.trim()) {
      return Response.json({ success: false, error: "tableNumber is required." }, { status: 400 });
    }

    // Duplicate check within restaurant
    const existing = await db.collection("tables").findOne({
      ...tenantFilter,
      tableNumber: tableNumber.trim().toUpperCase(),
    });
    if (existing) return Response.json({ success: false, error: "Table number already exists." }, { status: 409 });

    const doc = {
      ...tenantFilter,
      tableNumber: tableNumber.trim().toUpperCase(),
      capacity: parseInt(capacity, 10) || 4,
      status: status ?? "available",
      categoryId: categoryId ?? null,
      zone: zone ?? "",
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };

    const result = await db.collection("tables").insertOne(doc);
    return Response.json({
      success: true,
      table: { ...doc, id: result.insertedId.toString(), _id: undefined },
    }, { status: 201 });
  }
);
