import { verifyEmail } from "@/lib/authService";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const token = String(body?.token ?? "").trim();
  if (!token) {
    return Response.json({ success: false, error: "Verification token is required." }, { status: 400 });
  }

  try {
    await verifyEmail(token);
    return Response.json({ success: true, message: "Email verified successfully." });
  } catch (err) {
    if (err.message === "TOKEN_INVALID_OR_EXPIRED") {
      return Response.json(
        { success: false, error: "Verification link is invalid or expired." },
        { status: 400 }
      );
    }
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
