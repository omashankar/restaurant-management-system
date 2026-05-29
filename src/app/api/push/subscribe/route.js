import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { getPlatformSettings } from "@/lib/platformSettings";

/** POST — save browser push subscription (super_admin platform alerts). */
export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.id) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subscription = body?.subscription;
  if (!subscription?.endpoint) {
    return Response.json({ success: false, error: "Invalid subscription." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const settings = await getPlatformSettings(db);
    if (!settings.notifications?.pushEnabled) {
      return Response.json(
        { success: false, error: "Push notifications are disabled in platform settings." },
        { status: 403 },
      );
    }

    await db.collection("push_subscriptions").updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          userId: payload.id,
          role: payload.role,
          scope: payload.role === "super_admin" ? "platform" : "user",
          subscription,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("push subscribe:", err.message);
    return Response.json({ success: false, error: "Failed to save subscription." }, { status: 500 });
  }
}
