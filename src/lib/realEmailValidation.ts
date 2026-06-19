import { BUSINESS_EMAIL_MESSAGE, isValidBusinessEmail } from "@/lib/businessEmailValidation";
import { assertEmailDomainDeliverable, UNDELIVERABLE_EMAIL_MESSAGE } from "@/lib/emailDeliverability";
import { isValidEmailAddress, STRICT_EMAIL_MESSAGE } from "@/lib/emailValidation";

export { UNDELIVERABLE_EMAIL_MESSAGE };

type RealEmailOptions = {
  /** Restaurant owner / business registration */
  business?: boolean;
  /** Run MX lookup (default true) */
  verifyMx?: boolean;
};

/**
 * Full server-side check: format + real domain + optional MX + optional business rules.
 */
export async function assertRealEmail(
  email: string,
  options: RealEmailOptions = {},
): Promise<void> {
  const { business = false, verifyMx = true } = options;
  const trimmed = String(email ?? "").trim();

  if (!isValidEmailAddress(trimmed)) {
    const err = new Error("EMAIL_FORMAT_INVALID");
    throw err;
  }

  if (business) {
    if (!isValidBusinessEmail(trimmed)) {
      const err = new Error("EMAIL_BUSINESS_INVALID");
      throw err;
    }
  }

  if (verifyMx) {
    await assertEmailDomainDeliverable(trimmed);
  }
}

export function realEmailErrorResponse(err: unknown, { business = false } = {}) {
  const code = err instanceof Error ? err.message : "";
  if (code === "EMAIL_FORMAT_INVALID") {
    return Response.json(
      { success: false, error: business ? BUSINESS_EMAIL_MESSAGE : STRICT_EMAIL_MESSAGE },
      { status: 400 },
    );
  }
  if (code === "EMAIL_BUSINESS_INVALID") {
    return Response.json({ success: false, error: BUSINESS_EMAIL_MESSAGE }, { status: 400 });
  }
  if (code === "EMAIL_DOMAIN_UNDELIVERABLE") {
    return Response.json({ success: false, error: UNDELIVERABLE_EMAIL_MESSAGE }, { status: 400 });
  }
  return null;
}
