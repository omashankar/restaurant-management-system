function normalizeKey(addr) {
  return String(addr ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Remove consecutive duplicate words (e.g. "kota borkheda kota" → "kota borkheda"). */
function collapseRepeatedWords(addr) {
  const words = String(addr ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const out = [words[0]];
  for (let i = 1; i < words.length; i += 1) {
    if (words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
      out.push(words[i]);
    }
  }
  return out.join(" ");
}

function looksLikeDeliveryAddress(addr) {
  const cleaned = String(addr ?? "").trim();
  if (cleaned.length < 12) return false;

  const letters = cleaned.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 8) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;

  const vowelRatio = (letters.match(/[aeiouAEIOU]/g) ?? []).length / letters.length;
  if (vowelRatio < 0.12) return false;

  return true;
}

/**
 * Clean order-derived addresses for display — dedupe, trim junk, skip profile duplicate.
 */
export function dedupeSavedAddresses(addresses, profileAddress = "") {
  const seen = new Set();
  const profileKey = normalizeKey(profileAddress);
  if (profileKey) seen.add(profileKey);

  const result = [];
  for (const raw of addresses ?? []) {
    const cleaned = collapseRepeatedWords(String(raw ?? "").trim());
    if (!looksLikeDeliveryAddress(cleaned)) continue;

    const key = normalizeKey(cleaned);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(cleaned);
  }

  return result.slice(0, 5);
}
