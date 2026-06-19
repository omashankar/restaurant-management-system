import { z } from "zod";
import {
  isRealEmailDomain,
} from "@/lib/emailDomainValidation";

const MAX_EMAIL_LENGTH = 254;
/** Legacy length guard — ICANN / typo checks live in emailDomainValidation. */
const TLD_RE = /^[a-zA-Z]{2,6}$/;
const DOMAIN_LABEL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export const STRICT_EMAIL_MESSAGE =
  "Enter a valid email address (e.g. name@restaurant.com).";

export { BUSINESS_EMAIL_MESSAGE } from "@/lib/businessEmailValidation";

/**
 * Practical email check for account / contact forms.
 * Stricter than a bare regex — rejects plain text and fake long TLDs.
 */
export function isValidEmailAddress(email) {
  const trimmed = String(email ?? "").trim();
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH) return false;
  if (!z.string().email().safeParse(trimmed).success) return false;

  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return false;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();

  if (!local || local.length > 64) return false;
  if (!domain.includes(".")) return false;

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  const tld = labels[labels.length - 1];
  if (!TLD_RE.test(tld)) return false;

  for (const label of labels) {
    if (!label || label.length > 63) return false;
    if (!DOMAIN_LABEL_RE.test(label)) return false;
  }

  if (!isRealEmailDomain(domain)) return false;

  return true;
}

export function emailFormatError(email, { required = true } = {}) {
  const trimmed = String(email ?? "").trim();
  if (!trimmed) return required ? "Email is required." : null;
  if (!isValidEmailAddress(trimmed)) return STRICT_EMAIL_MESSAGE;
  return null;
}

/** Zod — required account email (signup, staff, login, profile APIs). */
export const strictRequiredEmailSchema = z
  .string({ required_error: "Email is required." })
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(MAX_EMAIL_LENGTH, "Email too long.")
  .refine(isValidEmailAddress, { message: STRICT_EMAIL_MESSAGE });

/** Zod — optional email; empty allowed, non-empty must be valid. */
export const optionalStrictEmailSchema = z.preprocess(
  (val) => String(val ?? "").trim().toLowerCase(),
  z.union([
    z.literal(""),
    z
      .string()
      .max(MAX_EMAIL_LENGTH, "Email too long.")
      .refine(isValidEmailAddress, { message: STRICT_EMAIL_MESSAGE }),
  ])
);
