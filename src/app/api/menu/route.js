import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request) => {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const status     = searchParams.get("status");

    const filter = { ...tenantFilter };
    if (categoryId)              filter.categoryId = categoryId;
    if (status && status !== "all") filter.status  = status;

    const items = await db.collection("menuItems")
      .find(filter)
      .sort({ categoryName: 1, name: 1 })
      .toArray();

    return Response.json({
      success: true,
      items: items.map((i) => ({ ...i, id: i._id.toString(), _id: undefined })),
    });
  }
);

export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, payload }, request) => {
    const body = await request.json();
    const { name, price, categoryId, categoryName, description, status,
            itemType, prepTime, kitchenType, image } = body;

    if (!name?.trim() || price == null || !categoryId) {
      return Response.json({ success: false, error: "name, price and categoryId are required." }, { status: 400 });
    }

    const doc = {
      ...tenantFilter,
      name: name.trim(),
      price: Number(price),
      categoryId,
      categoryName: categoryName ?? "",
      description: description?.trim() ?? "",
      status: status ?? "active",
      itemType: itemType ?? "other",
      prepTime: prepTime ?? null,
      kitchenType: kitchenType ?? "default_kitchen",
      image: image ?? null,
      badge: null,
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };

    const result = await db.collection("menuItems").insertOne(doc);

    // Update category item count
    await db.collection("categories").updateOne(
      { ...tenantFilter, _id: new ObjectId(categoryId).valueOf() },
      { $inc: { itemCount: 1 } }
    ).catch(() => {});

    return Response.json({
      success: true,
      item: { ...doc, id: result.insertedId.toString(), _id: undefined },
    }, { status: 201 });
  }
);
