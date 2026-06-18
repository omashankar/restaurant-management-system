import { z } from "zod";

const MAX_EMAIL_LENGTH = 254;
/** Real-world TLDs are 2–6 letters (.com, .in, .museum). Blocks typos like .comsssssss */
const TLD_RE = /^[a-zA-Z]{2,6}$/;
const DOMAIN_LABEL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

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

  return true;
}

export function emailFormatError(email, { required = true } = {}) {
  const trimmed = String(email ?? "").trim();
  if (!trimmed) return required ? "Email is required." : null;
  if (!isValidEmailAddress(trimmed)) return "Enter a valid email address (e.g. name@restaurant.com).";
  return null;
}
