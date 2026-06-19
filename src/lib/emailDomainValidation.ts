import { parse } from "tldts";

/** Consumer mailbox brand names often typosquatted (gmaidl, gmial, etc.). */
const TYPO_SQUAT_ROOTS = [
  "gmail",
  "googlemail",
  "yahoo",
  "hotmail",
  "outlook",
  "icloud",
  "live",
  "aol",
  "protonmail",
  "rediffmail",
  "yandex",
  "mailinator",
  "guerrillamail",
] as const;

const MAX_TYPO_DISTANCE = 2;

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/** Hostname must use a real public ICANN suffix (rejects gmaidl.codmd, .comss, etc.). */
export function isStructurallyValidEmailDomain(hostname: string): boolean {
  const host = String(hostname ?? "").trim().toLowerCase();
  if (!host || host.length > 253) return false;

  const parsed = parse(host);
  if (!parsed.hostname || !parsed.domain || !parsed.publicSuffix) return false;
  if (parsed.isIp) return false;
  if (parsed.isSpecialUse) return false;
  if (parsed.isIcann !== true) return false;

  const labels = host.split(".");
  for (const label of labels) {
    if (!label || label.length > 63) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }

  return true;
}

/**
 * Reject domains that look like typos of major free/disposable providers
 * (e.g. gmaidl.codmd, gmial.com) but allow the real provider on non-business flows.
 */
export function isTyposquatEmailDomain(hostname: string): boolean {
  const host = String(hostname ?? "").trim().toLowerCase();
  const parsed = parse(host);
  const registrable = (parsed.domainWithoutSuffix ?? "").toLowerCase();
  const fullDomain = (parsed.domain ?? "").toLowerCase();
  if (!registrable) return true;

  for (const stem of TYPO_SQUAT_ROOTS) {
    if (registrable === stem || fullDomain === `${stem}.com`) continue;
    if (registrable.length >= 3 && levenshtein(registrable, stem) <= MAX_TYPO_DISTANCE) {
      return true;
    }
  }

  return false;
}

export function isRealEmailDomain(hostname: string): boolean {
  const host = String(hostname ?? "").trim().toLowerCase();
  if (!host) return false;
  if (!isStructurallyValidEmailDomain(host)) return false;
  if (isTyposquatEmailDomain(host)) return false;
  return true;
}
