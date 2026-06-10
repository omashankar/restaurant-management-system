import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { getClientIp, landingContactLimiter } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await landingContactLimiter.check(`newsletter:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ success: false, error: "Please enter a valid email." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);

    await db.collection("newsletter_subscribers").updateOne(
      { email, restaurantId: restaurantId ?? null },
      {
        $set: {
          email,
          restaurantId: restaurantId ?? null,
          source: "customer_site",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return Response.json({ success: true, message: "Thanks for subscribing!" });
  } catch (err) {
    console.error("customer.newsletter.POST failed:", err?.message);
    return Response.json({ success: false, error: "Could not subscribe. Please try again." }, { status: 500 });
  }
}
