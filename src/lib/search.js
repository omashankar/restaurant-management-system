export function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function safeSearchPattern(raw, maxLength = 64) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "";
  const truncated = value.slice(0, maxLength);
  return escapeRegex(truncated);
}
