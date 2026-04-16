import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

/* GET /api/tables/areas */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }) => {
    const areas = await db.collection("tableAreas")
      .find(tenantFilter)
      .sort({ name: 1 })
      .toArray();

    return Response.json({
      success: true,
      areas: areas.map((a) => ({ ...a, id: a._id.toString(), _id: undefined })),
    });
  }
);

/* POST /api/tables/areas */
export const POST = withTenant(
  ["admin"],
  async ({ db, tenantFilter, payload }, request) => {
    const { name, description, color } = await request.json();
    if (!name?.trim()) {
      return Response.json({ success: false, error: "Area name is required." }, { status: 400 });
    }

    const doc = {
      ...tenantFilter,
      name: name.trim(),
      description: description?.trim() ?? "",
      color: color ?? "emerald",
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };

    const result = await db.collection("tableAreas").insertOne(doc);
    return Response.json({
      success: true,
      area: { ...doc, id: result.insertedId.toString(), _id: undefined },
    }, { status: 201 });
  }
);
