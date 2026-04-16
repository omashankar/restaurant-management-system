import { resendVerification } from "@/lib/authService";
import { sendVerificationEmail } from "@/lib/emailService";
import { getClientIp, resendLimiter } from "@/lib/rateLimit";
import { parseSchema, resendSchema } from "@/lib/validationSchemas";

export async function POST(request) {
  /* ── Rate limit ── */
  const ip = getClientIp(request);
  const limit = resendLimiter.check(ip);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many requests. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email } = parseSchema(resendSchema, body);

    const user = await resendVerification(email);

    sendVerificationEmail({
      name: user.name,
      email: user.email,
      token: user.verificationToken,
    }).catch((err) => console.error("Resend email failed:", err.message));

    return Response.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });

  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      /* Don't reveal if email exists — return same success message */
      return Response.json({
        success: true,
        message: "If this email is registered, a verification link has been sent.",
      });
    }
    if (err.message === "ALREADY_VERIFIED") {
      return Response.json(
        { success: false, error: "This email is already verified. Please login." },
        { status: 409 }
      );
    }

    console.error("Resend error:", err.message);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
