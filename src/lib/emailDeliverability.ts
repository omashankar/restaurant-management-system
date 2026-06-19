import dns from "node:dns/promises";
import { extractEmailDomain } from "@/lib/businessEmailValidation";

export const UNDELIVERABLE_EMAIL_MESSAGE =
  "Please enter a real email address that can receive mail.";

const DNS_TIMEOUT_MS = 6_000;

function shouldVerifyMx(): boolean {
  if (process.env.SKIP_EMAIL_MX_CHECK === "1") return false;
  return true;
}

async function resolveMxWithTimeout(hostname: string) {
  return Promise.race([
    dns.resolveMx(hostname),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), DNS_TIMEOUT_MS);
    }),
  ]);
}

/** True when the domain publishes MX records (can receive email). */
export async function domainAcceptsMail(hostname: string): Promise<boolean> {
  const host = String(hostname ?? "").trim().toLowerCase();
  if (!host) return false;
  try {
    const records = await resolveMxWithTimeout(host);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Ensures the email domain can receive mail (MX lookup).
 * Skipped when SKIP_EMAIL_MX_CHECK=1 (local scripts / CI).
 */
export async function assertEmailDomainDeliverable(email: string): Promise<void> {
  if (!shouldVerifyMx()) return;

  const domain = extractEmailDomain(email);
  if (!domain) {
    const err = new Error("EMAIL_DOMAIN_UNDELIVERABLE");
    throw err;
  }

  const accepts = await domainAcceptsMail(domain);
  if (!accepts) {
    const err = new Error("EMAIL_DOMAIN_UNDELIVERABLE");
    throw err;
  }
}

export function deliverableEmailErrorResponse(message = UNDELIVERABLE_EMAIL_MESSAGE) {
  return Response.json({ success: false, error: message }, { status: 400 });
}
