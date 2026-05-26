import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || name.length < 2) {
      return Response.json({ success: false, error: "Please enter your name." }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ success: false, error: "Please enter a valid email." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return Response.json(
        { success: false, error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);

    const doc = {
      restaurantId: restaurantId ?? null,
      name,
      email,
      subject: subject || "General inquiry",
      message,
      status: "new",
      source: "customer_site",
      createdAt: new Date(),
    };

    await db.collection("contact_messages").insertOne(doc);

    return Response.json({
      success: true,
      message: "Thanks! We received your message and will reply soon.",
    });
  } catch (err) {
    console.error("customer.contact.POST failed:", err?.message);
    return Response.json(
      { success: false, error: "Could not send message. Please try again." },
      { status: 500 }
    );
  }
}
