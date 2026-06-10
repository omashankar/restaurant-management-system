import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    let oid;
    try {
      oid = new ObjectId(id);
    } catch {
      return Response.json({ success: false, error: "Invalid item id." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });
    }

    const item = await db.collection("menuItems").findOne({ _id: oid, restaurantId });
    if (!item) {
      return Response.json({ success: false, error: "Item not found." }, { status: 404 });
    }

    const stock = item.stock != null ? Number(item.stock) : null;
    const soldOut = item.status !== "active" || stock === 0;

    return Response.json({
      success: true,
      item: {
        id: String(item._id),
        name: item.name ?? "",
        description: item.description ?? "",
        price: Number(item.price ?? 0),
        image: item.image ?? "",
        categoryId: item.categoryId ?? "",
        categoryName: item.categoryName ?? "",
        itemType: item.itemType ?? "",
        prepTime: item.prepTime ?? null,
        badge: item.badge ?? "",
        status: item.status ?? "active",
        stock,
        soldOut,
        addOns: Array.isArray(item.addOns)
          ? item.addOns.map((a) => ({
              id: String(a.id ?? a.name ?? ""),
              name: String(a.name ?? ""),
              price: Number(a.price ?? 0),
            })).filter((a) => a.name)
          : [],
        sizes: Array.isArray(item.sizes)
          ? item.sizes.map((s) => ({
              id: String(s.id ?? s.label ?? ""),
              label: String(s.label ?? s.name ?? ""),
              price: Number(s.price ?? item.price ?? 0),
            })).filter((s) => s.label)
          : [],
      },
    });
  } catch (err) {
    console.error("customer.menu.[id].GET failed:", err?.message);
    return Response.json({ success: false, error: "Failed to load menu item." }, { status: 500 });
  }
}
