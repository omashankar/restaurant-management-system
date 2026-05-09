import clientPromise from "@/lib/mongodb";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";

export async function PATCH(request) {
  const payload = verifyToken(getTokenFromRequest(request));
  if (!payload?.id) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const keys = Array.isArray(body?.keys)
    ? body.keys.map((k) => String(k).trim()).filter(Boolean)
    : [];
  if (!keys.length) {
    return Response.json({ success: false, error: "No inbox keys provided." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = String(payload.id);
    const now = new Date();
    const ops = keys.map((key) => ({
      updateOne: {
        filter: { userId, key },
        update: { $set: { userId, key, readAt: now } },
        upsert: true,
      },
    }));
    await db.collection("inbox_reads").bulkWrite(ops, { ordered: false });
    return Response.json({ success: true });
  } catch (err) {
    console.error("inbox.read.PATCH failed:", err.message);
    return Response.json({ success: false, error: "Failed to mark as read." }, { status: 500 });
  }
}
