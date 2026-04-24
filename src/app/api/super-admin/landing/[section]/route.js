/**
 * Per-section Landing CMS routes
 *
 * GET  /api/super-admin/landing/:section  → read one section
 * PUT  /api/super-admin/landing/:section  → replace entire section
 * POST /api/super-admin/landing/:section  → add item (array sections only)
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { addItem, getSection, replaceSection, VALID_SECTIONS } from "@/lib/landingService";
import { revalidatePath, revalidateTag } from "next/cache";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

const forbidden  = () => Response.json({ success: false, error: "Forbidden." }, { status: 403 });
const badJson    = () => Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
const badSection = (s) => Response.json({ success: false, error: `Invalid section "${s}". Valid: ${VALID_SECTIONS.join(", ")}.` }, { status: 400 });

/* ── GET /api/super-admin/landing/:section ── */
export async function GET(request, { params }) {
  if (!superAdminOnly(request)) return forbidden();
  const { section } = await params;
  if (!VALID_SECTIONS.includes(section)) return badSection(section);
  try {
    const data = await getSection(section);
    return Response.json({ success: true, section, data });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.status ?? 500 });
  }
}

/* ── PUT /api/super-admin/landing/:section — replace entire section ── */
export async function PUT(request, { params }) {
  if (!superAdminOnly(request)) return forbidden();
  const { section } = await params;
  if (!VALID_SECTIONS.includes(section)) return badSection(section);
  let body;
  try { body = await request.json(); } catch { return badJson(); }
  try {
    const result = await replaceSection(section, body);
    revalidateTag("landing");
    revalidatePath("/");
    return Response.json({ success: true, ...result });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.status ?? 500 });
  }
}

/* ── POST /api/super-admin/landing/:section — add item to array section ── */
export async function POST(request, { params }) {
  if (!superAdminOnly(request)) return forbidden();
  const { section } = await params;
  if (!VALID_SECTIONS.includes(section)) return badSection(section);
  let body;
  try { body = await request.json(); } catch { return badJson(); }
  try {
    const result = await addItem(section, body);
    revalidateTag("landing");
    revalidatePath("/");
    return Response.json({ success: true, ...result }, { status: 201 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.status ?? 500 });
  }
}
