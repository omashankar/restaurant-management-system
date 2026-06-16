/** Public marketing routes that share the landing preloader. */
export const MARKETING_SHELL_PATHS = ["/", "/privacy", "/terms"];

export function isPublicMarketingShell(pathname = "") {
  if (!pathname) return false;
  if (pathname === "/maintenance") return false;
  return MARKETING_SHELL_PATHS.includes(pathname);
}
