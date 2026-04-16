import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/authCookies";

/* ── Role → allowed path prefixes ── */
const ROLE_PATHS = {
  admin:   ["/admin", "/dashboard", "/pos", "/orders", "/menu", "/tables",
            "/reservations", "/customers", "/staff", "/inventory",
            "/analytics", "/settings", "/kitchen", "/profile"],
  manager: ["/manager", "/dashboard", "/pos", "/orders", "/menu", "/tables",
            "/reservations", "/customers", "/inventory", "/analytics", "/profile"],
  waiter:  ["/waiter", "/pos", "/orders", "/tables", "/reservations", "/customers", "/profile"],
  chef:    ["/chef", "/kitchen", "/orders", "/profile"],
};

/* ── Role home pages ── */
const ROLE_HOME = {
  admin:   "/admin/dashboard",
  manager: "/manager/dashboard",
  waiter:  "/waiter/dashboard",
  chef:    "/chef/dashboard",
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

/** Decode JWT payload without crypto (Edge-safe) */
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

  /* ── Allow public paths ── */
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  /* ── Allow static assets ── */
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  /* ── No token → login ── */
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname); // remember where they came from
    return NextResponse.redirect(url);
  }

  const payload = decodeJwt(token);

  /* ── Invalid token → login + clear cookie ── */
  if (!payload?.role) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  /* ── Expired token → login + clear cookie ── */
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  /* ── RBAC: check if role can access this path ── */
  const allowed = ROLE_PATHS[payload.role] ?? [];
  const canAccess = allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!canAccess) {
    /* Redirect to /unauthorized instead of silently bouncing */
    const url = new URL("/unauthorized", request.url);
    url.searchParams.set("role", payload.role);
    url.searchParams.set("path", pathname);
    return NextResponse.redirect(url);
  }

  /* ── Attach user info to headers for server components ── */
  const res = NextResponse.next();
  res.headers.set("x-user-id",        payload.id           ?? "");
  res.headers.set("x-user-role",      payload.role         ?? "");
  res.headers.set("x-restaurant-id",  payload.restaurantId ?? "");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
