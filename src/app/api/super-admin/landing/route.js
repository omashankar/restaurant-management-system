import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { getLandingContent, replaceAll, replaceSection, VALID_SECTIONS } from "@/lib/landingService";
import { revalidatePath, revalidateTag } from "next/cache";

/* ── Auth guard ── */
function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const result = await getLandingContent();
    return Response.json({ success: true, ...result });
  } catch (err) {
    console.error("GET landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { section, data } = body;
  if (!section || !VALID_SECTIONS.includes(section)) {
    return Response.json(
      { success: false, error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}.` },
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

  try {
    await replaceSection(section, data, sa.id ?? null);

    /* Purge the public landing page cache immediately */
    revalidateTag("landing"); // invalidates the tagged fetch in page.jsx
    revalidatePath("/");      // also purge the page route cache

    return Response.json({ success: true, section, updatedAt: new Date() });
  } catch (err) {
    console.error("PATCH landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(request) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  try {
    const sanitized = { ...body };
    delete sanitized.pricing;
    await replaceAll(sanitized, sa.id ?? null);

    revalidateTag("landing");
    revalidatePath("/");

    return Response.json({ success: true, updatedAt: new Date(), replaced: true });
  } catch (err) {
    console.error("PUT landing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
