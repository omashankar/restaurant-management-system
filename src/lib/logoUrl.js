/** Normalize logo path from settings (relative or absolute). */
export function normalizeLogoSrc(logoUrl) {
  const url = logoUrl?.trim();
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/${url.replace(/^\//, "")}`;
}
