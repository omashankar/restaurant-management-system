import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }) => {
    const cats = await db.collection("categories")
      .find(tenantFilter)
      .sort({ name: 1 })
      .toArray();

    // Attach live item counts
    const counts = await db.collection("menuItems").aggregate([
      { $match: tenantFilter },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]).toArray();
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    return Response.json({
      success: true,
      categories: cats.map((c) => ({
        ...c,
        id: c._id.toString(),
        _id: undefined,
        itemCount: countMap[c._id.toString()] ?? 0,
      })),
    });
  }
);

export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, payload }, request) => {
    const { name, description } = await request.json();
    if (!name?.trim()) {
      return Response.json({ success: false, error: "Category name is required." }, { status: 400 });
    }

    const doc = {
      ...tenantFilter,
      name: name.trim(),
      description: description?.trim() ?? "",
      itemCount: 0,
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };

    const result = await db.collection("categories").insertOne(doc);
    return Response.json({
      success: true,
      category: { ...doc, id: result.insertedId.toString(), _id: undefined },
    }, { status: 201 });
  }
);
