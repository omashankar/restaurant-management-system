import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import {
  getLandingContent,
  replaceAll,
  replaceSection,
  VALID_SECTIONS,
} from "@/lib/landingService";
import { revalidatePath, revalidateTag } from "next/cache";

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function mapPlansToLandingPricing(plans = []) {
  return plans.map((plan, index) => {
    const normalizedPrice = Number(plan.price) || 0;
    const monthly = Number.isFinite(Number(plan.monthlyPrice))
      ? Number(plan.monthlyPrice)
      : (plan.billingCycle === "yearly"
        ? Number((normalizedPrice / 12).toFixed(2))
        : normalizedPrice);
    const yearly = Number.isFinite(Number(plan.yearlyPrice))
      ? Number(plan.yearlyPrice)
      : (plan.billingCycle === "yearly"
        ? normalizedPrice
        : Number((normalizedPrice * 12).toFixed(2)));
    return {
      id: plan.slug || String(plan._id),
      order: index + 1,
      name: plan.name,
      slug: plan.slug,
      price: { monthly, yearly },
      description: plan.description ?? "",
      highlight: plan.slug === "pro",
      badge: plan.slug === "pro" ? "Most Popular" : null,
      cta: "Start Free Trial",
      features: Array.isArray(plan.features)
        ? plan.features.map((feature) => ({ text: String(feature), included: true }))
        : [],
    };
  });
}

export async function GET() {
  try {
    const data = await getLandingContent();
    const client = await clientPromise;
    const db = client.db();
    const plans = await db.collection("plans").find({ isActive: { $ne: false } }).sort({ price: 1 }).toArray();
    const pricing = mapPlansToLandingPricing(plans);
    return Response.json({
      success: true,
      ...data,
      content: {
        ...data.content,
        pricing: pricing.length > 0 ? pricing : data.content?.pricing ?? [],
      },
    });
  } catch (err) {
    console.error("GET /api/landing-page error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json(
      { success: false, error: "Forbidden. Super Admin access required." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (body.replace === true) {
      if (!body.content || typeof body.content !== "object" || Array.isArray(body.content)) {
        return Response.json(
          { success: false, error: "content object is required when replace is true." },
          { status: 400 }
        );
      }
      const sanitizedContent = { ...body.content };
      delete sanitizedContent.pricing;
      const result = await replaceAll(sanitizedContent, sa.id ?? null);
      revalidateTag("landing");
      revalidatePath("/");
      return Response.json({ success: true, ...result });
    }

    const { section, data } = body;
    if (!section || !VALID_SECTIONS.includes(section)) {
      return Response.json(
        { success: false, error: `section is required. Valid values: ${VALID_SECTIONS.join(", ")}` },
        { status: 400 }
      );
    }
    if (section === "pricing") {
      return Response.json(
        { success: false, error: "Pricing is managed from Super Admin Plans. Update /super-admin/plans instead." },
        { status: 400 }
      );
    }
    if (data == null) {
      return Response.json({ success: false, error: "data is required." }, { status: 400 });
    }

    const result = await replaceSection(section, data, sa.id ?? null);
    revalidateTag("landing");
    revalidatePath("/");
    return Response.json({ success: true, ...result });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message ?? "Something went wrong." },
      { status: err.status ?? 500 }
    );
  }
}
