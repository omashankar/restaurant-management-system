import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { ObjectId } from "mongodb";

function buildCustomerMatch(payload) {
  const match = [];
  if (payload.phone) match.push({ "customerInfo.phone": payload.phone });
  if (payload.email) {
    const email = String(payload.email).trim().toLowerCase();
    if (email) match.push({ "customerInfo.email": email });
  }
  if (payload.id) {
    try {
      match.push({ customerAccountId: new ObjectId(payload.id) });
    } catch {
      // ignore invalid id
    }
  }
  return match;
}

export async function GET(request) {
  const payload = verifyCustomerToken(getCustomerTokenFromRequest(request));
  if (!payload?.id && !payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const match = buildCustomerMatch(payload);
    if (match.length === 0) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const [orders, account] = await Promise.all([
      db.collection("orders").find({ $or: match }).sort({ createdAt: -1 }).limit(100).toArray(),
      payload.id
        ? db.collection("customerAccounts").findOne(
            { _id: new ObjectId(payload.id) },
            { projection: { rewardPoints: 1, walletBalance: 1 } }
          )
        : Promise.resolve(null),
    ]);

    const itemCountMap = new Map();
    const addresses = new Set();
    for (const order of orders) {
      if (order?.customerInfo?.address) {
        addresses.add(String(order.customerInfo.address).trim());
      }
      const items = Array.isArray(order.items) ? order.items : [];
      for (const line of items) {
        const name = String(line?.name ?? "").trim();
        const qty = Number(line?.qty ?? 0);
        if (!name) continue;
        itemCountMap.set(name, (itemCountMap.get(name) ?? 0) + (Number.isFinite(qty) ? qty : 1));
      }
    }

    const favorites = [...itemCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return Response.json({
      success: true,
      summary: {
        favorites,
        savedAddresses: [...addresses].slice(0, 6),
        rewardPoints: Number(account?.rewardPoints ?? 0),
        walletBalance: Number(account?.walletBalance ?? 0),
      },
    });
  } catch (err) {
    console.error("customer.dashboard.summary failed:", err.message);
    return Response.json({ success: false, error: "Failed to load dashboard summary." }, { status: 500 });
  }
}
