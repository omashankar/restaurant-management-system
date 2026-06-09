import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { ObjectId } from "mongodb";

function requireAuth(request) {
  const payload = verifyCustomerToken(getCustomerTokenFromRequest(request));
  if (!payload?.id) return null;
  try {
    return { payload, accountId: new ObjectId(payload.id) };
  } catch {
    return null;
  }
}

export async function GET(request) {
  const auth = requireAuth(request);
  if (!auth) {
    return Response.json({ success: false, error: "Login required." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
    const account = await db.collection("customerAccounts").findOne(
      { _id: auth.accountId },
      { projection: { favoriteItemIds: 1 } }
    );
    const ids = Array.isArray(account?.favoriteItemIds) ? account.favoriteItemIds : [];
    const objectIds = ids
      .map((id) => {
        try { return new ObjectId(String(id)); } catch { return null; }
      })
      .filter(Boolean);

    if (objectIds.length === 0) {
      return Response.json({ success: true, favorites: [] });
    }

    const filter = { _id: { $in: objectIds }, status: "active" };
    if (restaurantId) filter.restaurantId = restaurantId;

    const items = await db.collection("menuItems").find(filter).toArray();
    return Response.json({
      success: true,
      favorites: items.map((item) => ({
        id: String(item._id),
        name: item.name ?? "",
        price: Number(item.price ?? 0),
        image: item.image ?? "",
        itemType: item.itemType ?? "",
      })),
      favoriteIds: ids.map(String),
    });
  } catch (err) {
    console.error("customer.favorites.GET failed:", err?.message);
    return Response.json({ success: false, error: "Failed to load favorites." }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAuth(request);
  if (!auth) {
    return Response.json({ success: false, error: "Login required." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  const itemId = String(body?.itemId ?? "").trim();
  if (!itemId) {
    return Response.json({ success: false, error: "itemId is required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    await db.collection("customerAccounts").updateOne(
      { _id: auth.accountId },
      { $addToSet: { favoriteItemIds: itemId }, $set: { updatedAt: new Date() } }
    );
    return Response.json({ success: true, itemId, favorited: true });
  } catch (err) {
    console.error("customer.favorites.POST failed:", err?.message);
    return Response.json({ success: false, error: "Could not save favorite." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAuth(request);
  if (!auth) {
    return Response.json({ success: false, error: "Login required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = String(searchParams.get("itemId") ?? "").trim();
  if (!itemId) {
    return Response.json({ success: false, error: "itemId is required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    await db.collection("customerAccounts").updateOne(
      { _id: auth.accountId },
      { $pull: { favoriteItemIds: itemId }, $set: { updatedAt: new Date() } }
    );
    return Response.json({ success: true, itemId, favorited: false });
  } catch (err) {
    console.error("customer.favorites.DELETE failed:", err?.message);
    return Response.json({ success: false, error: "Could not remove favorite." }, { status: 500 });
  }
}
