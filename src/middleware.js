import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/authCookies";

/* ══════════════════════════════════════════════════════════
   ROLE → ALLOWED PATH PREFIXES
   Each role can ONLY access paths listed here.
   super_admin has full access including /super-admin/*.
══════════════════════════════════════════════════════════ */
const ROLE_PATHS = {
  super_admin: [
    "/super-admin",
    "/admin", "/dashboard", "/pos", "/orders", "/menu",
    "/tables", "/reservations", "/customers", "/staff",
    "/inventory", "/analytics", "/settings", "/kitchen", "/profile",
  ],
  admin: [
    "/admin", "/dashboard", "/pos", "/orders", "/menu",
    "/tables", "/reservations", "/customers", "/staff",
    "/inventory", "/analytics", "/settings", "/kitchen", "/profile",
  ],
  manager: [
    "/manager", "/dashboard", "/pos", "/orders", "/menu",
    "/tables", "/reservations", "/customers",
    "/inventory", "/analytics", "/profile",
  ],
  waiter: ["/waiter", "/pos", "/orders", "/tables", "/reservations", "/customers", "/profile"],
  chef:   ["/chef", "/kitchen", "/orders", "/profile"],
};

/* ── Role home (redirect after login or unauthorized access) ── */
const ROLE_HOME = {
  super_admin: "/super-admin/dashboard",
  admin:       "/admin/dashboard",
  manager:     "/manager/dashboard",
  waiter:      "/waiter/dashboard",
  chef:        "/chef/dashboard",
};

/* ── Public paths — no auth needed ── */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/unauthorized",
  "/home",
  "/order",
  "/api",
  "/verify-email",
];

/* ── Decode JWT payload (Edge-safe, no crypto import) ── */
function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    const json = Buffer.from(part, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  /* ── 1. Allow public paths ── */
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  /* ── 2. Allow static assets ── */
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  /* ── 3. No token → redirect to login (remember original path) ── */
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const payload = decodeJwt(token);

  /* ── 4. Invalid token → clear cookie + redirect to login ── */
  if (!payload?.role) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  /* ── 5. Expired token → clear cookie + redirect to login ── */
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  const { role } = payload;

  /* ── 6. /super-admin/* → ONLY super_admin allowed ── */
  if (pathname.startsWith("/super-admin")) {
    if (role !== "super_admin") {
      const url = new URL("/unauthorized", request.url);
      url.searchParams.set("role", role);
      url.searchParams.set("path", pathname);
      url.searchParams.set("reason", "super_admin_only");
      return NextResponse.redirect(url);
    }
    // super_admin — allow through
    const res = NextResponse.next();
    res.headers.set("x-user-id",   payload.id   ?? "");
    res.headers.set("x-user-role", role);
    return res;
  }

  /* ── 7. RBAC: check role's allowed paths ── */
  const allowed   = ROLE_PATHS[role] ?? [];
  const canAccess = allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!canAccess) {
    const url = new URL("/unauthorized", request.url);
    url.searchParams.set("role", role);
    url.searchParams.set("path", pathname);
    return NextResponse.redirect(url);
  }

  /* ── 8. Authorized — attach user info to request headers ── */
  const res = NextResponse.next();
  res.headers.set("x-user-id",        payload.id           ?? "");
  res.headers.set("x-user-role",      role);
  res.headers.set("x-restaurant-id",  payload.restaurantId ?? "");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
