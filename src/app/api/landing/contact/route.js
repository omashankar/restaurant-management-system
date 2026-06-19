import clientPromise from "@/lib/mongodb";
import { getClientIp, landingContactLimiter } from "@/lib/rateLimit";
import { emailFormatError } from "@/lib/emailValidation";
import { assertRealEmail, realEmailErrorResponse } from "@/lib/realEmailValidation";

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await landingContactLimiter.check(`landing-contact:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 3600) } }
    );
  }

  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const message = String(body?.message ?? "").trim();

    if (!name || name.length < 2 || !/[a-zA-Z\u0900-\u097F]/.test(name)) {
      return Response.json(
        { success: false, error: "Please enter a valid name (at least 2 letters)." },
        { status: 400 }
      );
    }
    const emailErr = emailFormatError(email);
    if (emailErr) {
      return Response.json({ success: false, error: emailErr }, { status: 400 });
    }
    try {
      await assertRealEmail(email);
    } catch (err) {
      const res = realEmailErrorResponse(err);
      if (res) return res;
      throw err;
    }
    if (!message || message.length < 10) {
      return Response.json(
        { success: false, error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const doc = {
      restaurantId: null,
      name,
      email,
      subject: "Landing page inquiry",
      message,
      status: "new",
      source: "landing_page",
      createdAt: new Date(),
    };

    await db.collection("contact_messages").insertOne(doc);

    return Response.json({
      success: true,
      message: "Thanks! We received your message and will reply soon.",
    });
  } catch (err) {
    console.error("landing.contact.POST failed:", err?.message);
    return Response.json(
      { success: false, error: "Could not send message. Please try again." },
      { status: 500 }
    );
  }
}
