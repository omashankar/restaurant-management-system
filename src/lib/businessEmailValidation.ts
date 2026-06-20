import { z } from "zod";
import { isValidEmailAddress } from "@/lib/emailValidation";
import {
  DISPOSABLE_EMAIL_DOMAINS,
  FREE_EMAIL_DOMAINS,
} from "@/lib/businessEmailDomains";

export const BUSINESS_EMAIL_MESSAGE =
  "Please enter a valid business email address.";

const MAX_EMAIL_LENGTH = 254;

export type BusinessEmailRejectReason =
  | "empty"
  | "format"
  | "free_provider"
  | "disposable";

export function extractEmailDomain(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return "";
  return trimmed.slice(at + 1);
}

export function isFreeEmailDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return false;
  if (FREE_EMAIL_DOMAINS.has(normalized)) return true;
  // Block subdomains of known free providers (e.g. mail.google.com → still gmail ecosystem)
  for (const free of FREE_EMAIL_DOMAINS) {
    if (normalized === free || normalized.endsWith(`.${free}`)) return true;
  }
  return false;
}

export function isDisposableEmailDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(normalized)) return true;
  for (const disposable of DISPOSABLE_EMAIL_DOMAINS) {
    if (normalized === disposable || normalized.endsWith(`.${disposable}`)) {
      return true;
    }
  }
  return false;
}

export function getBusinessEmailRejectReason(
  email: string,
  { required = true }: { required?: boolean } = {},
): BusinessEmailRejectReason | null {
  const trimmed = String(email ?? "").trim();
  if (!trimmed) return required ? "empty" : null;
  if (!isValidEmailAddress(trimmed)) return "format";
  const domain = extractEmailDomain(trimmed);
  if (isFreeEmailDomain(domain)) return "free_provider";
  if (isDisposableEmailDomain(domain)) return "disposable";
  return null;
}

export function isValidBusinessEmail(email: string): boolean {
  return getBusinessEmailRejectReason(email) === null;
}

export function businessEmailFormatError(
  email: string,
  { required = true }: { required?: boolean } = {},
): string | null {
  const reason = getBusinessEmailRejectReason(email, { required });
  if (!reason) return null;
  if (reason === "empty") return "Email is required.";
  return BUSINESS_EMAIL_MESSAGE;
}

/** Zod schema — required business email for owner / restaurant signup. */
export const businessRequiredEmailSchema = z
  .string({ message: "Email is required." })
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(MAX_EMAIL_LENGTH, "Email too long.")
  .refine(isValidEmailAddress, { message: BUSINESS_EMAIL_MESSAGE })
  .refine(
    (value) => !isFreeEmailDomain(extractEmailDomain(value)),
    { message: BUSINESS_EMAIL_MESSAGE },
  )
  .refine(
    (value) => !isDisposableEmailDomain(extractEmailDomain(value)),
    { message: BUSINESS_EMAIL_MESSAGE },
  );
