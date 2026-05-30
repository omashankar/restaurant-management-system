/** Shared auth UI classes — colors from --platform-primary / --platform-accent (Super Admin → Theme). */

export const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function isAuthRoute(pathname) {
  if (!pathname) return false;
  return AUTH_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export const authInputCls =
  "auth-input mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600";

export const authInputInlineCls =
  "auth-input w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600";

export const authInputWithIconCls =
  "auth-input w-full rounded-xl border border-zinc-700 bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600";

export const authInputGroupCls =
  "auth-input-group mt-1.5 flex items-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/80";

export const authInputWithIconPwCls =
  "auth-input w-full rounded-xl border border-zinc-700 bg-zinc-950/80 py-3 pl-10 pr-10 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600";

export const authBtnPrimaryCls =
  "auth-btn-primary cursor-pointer w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

export const authLogoBadgeCls =
  "auth-logo-badge mx-auto flex size-14 items-center justify-center rounded-2xl ring-1";

export const authLinkCls = "auth-link cursor-pointer font-medium transition-colors";

export const authSuccessBoxCls = "auth-success-box rounded-xl border px-3 py-2 text-xs";

export const authBadgeCls =
  "auth-badge rounded-full border px-2.5 py-0.5 text-[10px] font-semibold";

export const authSpinnerCls = "auth-spinner size-8 animate-spin";
